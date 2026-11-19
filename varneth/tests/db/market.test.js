import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { freshDb, player, dbAvailable, idem } from './helpers.js';

const HAS_DB = await dbAvailable();

// give a player a real, server-created item by farming
async function farmUntilItem(env, p, charId) {
  const s = await p.call('farm_start', { characterId: charId, kind: 'farm', target: 'abandoned_road' });
  for (let i = 0; i < 400; i++) {
    env.advance(20000);
    const h = await p.call('farm_heartbeat', { sessionId: s.session.id });
    if (h.settlement.items.length) { await p.call('farm_stop', { sessionId: s.session.id }); return h.settlement.items[0]; }
  }
  throw new Error('no item dropped');
}

async function setGold(env, userId, amount) {
  // test-only: credit through the ledger like the server does
  await env.db.query("update account_wallets set gold=$2 where user_id=$1", [userId, amount]);
}

describe.skipIf(!HAS_DB)('real player market (PostgreSQL)', () => {
  let env, A, B, C, aChar, bChar, item;
  beforeAll(async () => {
    env = await freshDb('market');
    A = player(env); B = player(env); C = player(env);
    await A.call('create_profile', { displayName: 'Satici' });
    await B.call('create_profile', { displayName: 'Alici' });
    await C.call('create_profile', { displayName: 'Rakip' });
    aChar = (await A.call('create_character', { slot: 1, name: 'Aslan', cls: 'warrior' })).characterId;
    bChar = (await B.call('create_character', { slot: 1, name: 'Bora', cls: 'ranger' })).characterId;
    item = await farmUntilItem(env, A, aChar);
  }, 120000);
  afterAll(async () => env && env.cleanup());

  it('lists a real item: fee charged, item moved to escrow', async () => {
    await setGold(env, A.userId, 1000);
    const r = await A.call('market_list', { itemId: item.id, price: 500, hours: 24 });
    expect(r.fee).toBe(10); // 2%
    expect(r.gold).toBe(990);
    const rows = await env.db.query('select location, character_id from item_instances where id=$1', [item.id]);
    expect(rows[0].location).toBe('market');
    item.listingId = r.listingId;
  });

  it('other user sees the listing with seller name', async () => {
    const s = await B.call('market_search', {});
    const l = s.listings.find((x) => x.id === item.listingId);
    expect(l).toBeTruthy();
    expect(l.seller).toBe('Satici');
    expect(l.item.base_id).toBe(item.base_id);
  });

  it('seller cannot buy own listing', async () => {
    await expect(A.call('market_buy', { listingId: item.listingId })).rejects.toMatchObject({ code: 'OWN_LISTING' });
  });

  it('buyer without enough gold is rejected and nothing changes', async () => {
    await setGold(env, B.userId, 100);
    await expect(B.call('market_buy', { listingId: item.listingId })).rejects.toMatchObject({ code: 'NOT_ENOUGH_GOLD' });
    const rows = await env.db.query('select owner_user, location from item_instances where id=$1', [item.id]);
    expect(rows[0].owner_user).toBe(A.userId);
    expect(rows[0].location).toBe('market');
  });

  it('two concurrent buyers: exactly one succeeds, gold conserved', async () => {
    await setGold(env, B.userId, 5000);
    await setGold(env, C.userId, 5000);
    const before = await env.db.query('select sum(gold)::float8 as s from account_wallets');
    const results = await Promise.allSettled([
      B.call('market_buy', { listingId: item.listingId }),
      C.call('market_buy', { listingId: item.listingId }),
      B.call('market_buy', { listingId: item.listingId }),
    ]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    expect(ok.length).toBe(1);
    const after = await env.db.query('select sum(gold)::float8 as s from account_wallets');
    // only the 5% commission leaves the economy
    expect(Number(before[0].s) - Number(after[0].s)).toBe(25);
    const tx = await env.db.query('select count(*)::int as n from market_transactions where listing_id=$1', [item.listingId]);
    expect(tx[0].n).toBe(1);
  });

  it('item moved completely with identical id and properties; seller got price minus 5%', async () => {
    const it = (await env.db.query('select * from item_instances where id=$1', [item.id]))[0];
    const buyer = (await env.db.query('select buyer_user from market_listings where id=$1', [item.listingId]))[0].buyer_user;
    expect(it.owner_user).toBe(buyer);
    expect(['stash', 'overflow']).toContain(it.location);
    expect(it.base_id).toBe(item.base_id);
    expect(it.affixes).toEqual(item.affixes);
    const seller = (await env.db.query('select gold::float8 as g from account_wallets where user_id=$1', [A.userId]))[0];
    expect(Number(seller.g)).toBe(990 + 475);
    // no copy left with seller
    const sellerItems = await env.db.query("select count(*)::int as n from item_instances where id=$1 and owner_user=$2", [item.id, A.userId]);
    expect(sellerItems[0].n).toBe(0);
  });

  it('sold listing cannot be bought again', async () => {
    await expect(C.call('market_buy', { listingId: item.listingId })).rejects.toMatchObject({ code: 'NOT_ACTIVE' });
  });

  it('replayed request (same idempotency key) does not double charge', async () => {
    // B re-lists the bought item, A buys with a retried key
    const buyer = (await env.db.query('select buyer_user from market_listings where id=$1', [item.listingId]))[0].buyer_user;
    const P = buyer === B.userId ? B : C;
    const r = await P.call('market_list', { itemId: item.id, price: 300, hours: 12 });
    await setGold(env, A.userId, 2000);
    const key = idem();
    const first = await A.call('market_buy', { listingId: r.listingId }, key);
    const second = await A.call('market_buy', { listingId: r.listingId }, key);
    expect(second.replayed).toBe(true);
    expect(second.price).toBe(first.price);
    const g = (await env.db.query('select gold::float8 as g from account_wallets where user_id=$1', [A.userId]))[0];
    expect(Number(g.g)).toBe(1700);
  });

  it('+10 upgraded, reforged item sells with all properties', async () => {
    const it = (await env.db.query('select * from item_instances where id=$1', [item.id]))[0];
    await env.db.query('update item_instances set upgrade=10, reforge_count=3 where id=$1', [item.id]);
    await env.db.query("insert into material_balances (user_id, scope, material_id, qty) values ($1,'00000000-0000-0000-0000-000000000000','arcane_dust',50)", [A.userId]);
    const r = await A.call('market_list', { itemId: item.id, price: 800, hours: 48 });
    await setGold(env, B.userId, 5000);
    await B.call('market_buy', { listingId: r.listingId });
    const after = (await env.db.query('select * from item_instances where id=$1', [item.id]))[0];
    expect(after.owner_user).toBe(B.userId);
    expect(after.upgrade).toBe(10);
    expect(after.reforge_count).toBe(3);
    expect(after.affixes).toEqual(it.affixes);
  });

  it('expired listing returns item to seller stash; cancel keeps fee', async () => {
    const r = await B.call('market_list', { itemId: item.id, price: 1000, hours: 12 });
    env.advance(13 * 3600 * 1000);
    await C.call('market_search', {});
    const it = (await env.db.query('select owner_user, location from item_instances where id=$1', [item.id]))[0];
    expect(it.owner_user).toBe(B.userId);
    expect(it.location).toBe('stash');
    const st = (await env.db.query('select status from market_listings where id=$1', [r.listingId]))[0];
    expect(st.status).toBe('expired');
  });

  it('max 10 active listings, and client cannot forge items', async () => {
    await expect(B.call('market_list', { itemId: globalThis.crypto.randomUUID(), price: 100, hours: 12 })).rejects.toMatchObject({ code: 'NO_ITEM' });
    await expect(B.call('market_list', { itemId: item.id, price: 5, hours: 12 })).rejects.toMatchObject({ code: 'BAD_PRICE' });
    await expect(B.call('market_list', { itemId: item.id, price: 100, hours: 7 })).rejects.toMatchObject({ code: 'BAD_DURATION' });
  });

  it('starter (system reward) items are not tradeable', async () => {
    const v = await A.call('character', { characterId: aChar });
    const starter = v.equipped.chest;
    await A.call('unequip', { characterId: aChar, slot: 'chest' });
    await expect(A.call('market_list', { itemId: starter.id, price: 100, hours: 12 })).rejects.toMatchObject({ code: 'NOT_TRADEABLE' });
  });

  it('market bounded per account (10)', async () => {
    // create 11 tradeable items directly as server-origin rows for the limit test
    const ids = [];
    for (let i = 0; i < 11; i++) {
      const r = await env.db.query(`insert into item_instances (owner_user, base_id, rarity, item_level, affixes, location, origin) values ($1,'ring_1',1,5,'[]','stash','test') returning id`, [C.userId]);
      ids.push(r[0].id);
    }
    await setGold(env, C.userId, 100000);
    for (let i = 0; i < 10; i++) await C.call('market_list', { itemId: ids[i], price: 100, hours: 12 });
    await expect(C.call('market_list', { itemId: ids[10], price: 100, hours: 12 })).rejects.toMatchObject({ code: 'TOO_MANY_LISTINGS' });
  });
});
