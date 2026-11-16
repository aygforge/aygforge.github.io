      drawOurShip(e, a) {
        var o, l;
        let r = this.layout(),
          n = this.ship;
        (!this.shipCanvas || this.shipCanvas.width !== r.w || this.shipCanvas.height !== r.h) && (this.shipCanvas = Qe(r.w, r.h));
        let i = this.shipCanvas.getContext("2d");
        i.clearRect(0, 0, r.w, r.h);
        let items = [];
        (this.cargoOverride || n.cargo).forEach((d, p) => {
          if (!d) return;
          let f = r.cargoSlots[p % r.cargoSlots.length],
            y = Math.floor(p / r.cargoSlots.length);
          items.push({ y: f.y + 4 + y * 0.01, fn: () => dS(i, Ca(d.good, d.spoiled), f.x, f.y + 6 - y * 6) });
        });
        items.push(...this.deck.items(i, "deck"));
        for (let d of this.entities)
          d.local &&
            N[d.kind] &&
            items.push({
              y: d.local.y + 0.2,
              fn: () => {
                let g = i.globalAlpha;
                (i.globalAlpha = g * d.alpha), N[d.kind](i, Math.round(d.local.x), Math.round(d.local.y), this.t, { W: this.W || 640, H: this.H || 360, ...(d.opts || {}) }), (i.globalAlpha = g);
              },
            });
        this.sailA = this.sailA || [];
        let acts = [...this.deck.actors.values(), ...this.deck.temp],
          custom = ((o = this.cosmetics) != null && o.flag) || this.flagUp;
        shipCompose(i, r, this.sails, items, this.t, {
          noFlag: custom,
          sailAlpha: (k, M) => {
            if (this.sails !== "full") return (this.sailA[k] = 1), 1;
            let B = M.spr.box,
              hid = acts.some(
                (A) => !A.hidden && A.kind !== "parrot" && !A.z && A.y < M.y - 3 && A.x > M.x + B.x0 - 4 && A.x < M.x + B.x1 + 4 && A.y - 18 < M.y + B.y1 && A.y > M.y + B.y0,
              ),
              tg = hid ? 0.42 : 0.86,
              c = this.sailA[k] == null || this.sailA[k] === 1 ? 0.86 : this.sailA[k];
            return (c += (tg - c) * 0.1), (this.sailA[k] = c), c;
          },
        });
        if ((o = this.cosmetics) != null && o.flag && !this.flagUp) {
          let d = r.masts[r.masts.length - 1],
            p = Math.sin(this.t * 4) > 0 ? 1 : 0,
            fy = d.y - d.h - 1;
          Te(i, d.x, fy - 10, fy + 1, "#3a2412"),
            b(i, d.x + 1, fy - 10, 9, 4, "#24508a"),
            b(i, d.x + 1, fy - 6, 7 + p, 2, "#24508a"),
            b(i, d.x + 4, fy - 9, 2, 2, "#f2c14e"),
            m(i, d.x + 10 + p, fy - 9, "#24508a"),
            Q(i, d.x + 1, d.x + 7, fy - 4, "#1a3a66");
        }
        if ((l = this.cosmetics) != null && l.stern) {
          let d = r.top + r.len + 1;
          b(i, r.cx - 8, d, 16, 3, "#8a6a20"),
            b(i, r.cx - 7, d, 14, 2, "#f2c14e"),
            m(i, r.cx, d - 1, "#fff0a0"),
            m(i, r.cx - 1, d - 1, "#f2c14e"),
            m(i, r.cx + 1, d - 1, "#f2c14e"),
            m(i, r.cx - 5, d + 1, "#c89030"),
            m(i, r.cx + 5, d + 1, "#c89030"),
            m(i, r.cx, d + 3, "#f2c14e");
        }
        if (this.flagUp) {
          let d = r.masts[0],
            fy = d.y - d.h - 1,
            p = Math.sin(this.t * 4) > 0 ? 1 : 0,
            c = this.flagColor || "#0a0a0a";
          Te(i, d.x, fy - 11, fy + 1, "#3a2412"), b(i, d.x + 1, fy - 11, 6, 7, c), b(i, d.x + 7, fy - 11 + p, 5, 7, c);
          this.flagColor || (b(i, d.x + 4, fy - 9, 3, 2, "#ffffff"), m(i, d.x + 5, fy - 7, "#ffffff"), m(i, d.x + 3, fy - 6, "#ffffff"), m(i, d.x + 7, fy - 6, "#ffffff"));
        }
        if (
          (this.deck.draw(i, "air"),
          (this.ocean.night || this.ocean.dark) && (H(i, r.cx, r.helm.y - 10, 13, "rgba(255,220,140,0.14)"), H(i, r.cx, r.helm.y - 10, 7, "rgba(255,220,140,0.12)")),
          e.save(),
          (e.globalAlpha = n.alpha),
          e.translate(Math.round(a.x + n.x), Math.round(a.y + n.y + n.sink)),
          e.rotate(n.rot),
          e.drawImage(this.shipCanvas, -Math.round(r.center.x), -Math.round(r.center.y)),
          e.restore(),
          this.speed > 6)
        ) {
          for (let d = 0; d < 7; d++) m(e, a.x + n.x + Math.sin(this.t * 7 + d) * (3 + d), a.y + n.y - r.len / 2 - 1 + d, "#ffffff");
          // kıç aynasının altında köpük
          let sy = a.y + n.y + r.len / 2 + (r.sternH || 0) - 1;
          for (let d = -6; d <= 6; d++) Math.sin(this.t * 9 + d * 1.7) > -0.2 && m(e, a.x + n.x + d * (r.beam / 16), sy + (Math.abs(d) % 2), "rgba(240,250,255,0.8)");
        }
      }
      drawEntity(e, a, r) {
        if (a.local && N[a.kind] && !a.screen) return;
        let n = Math.round(a.screen ? a.x : r.x + a.x),
          i = Math.round(a.screen ? a.y : r.y + a.y);
        if ((e.save(), (e.globalAlpha = a.alpha), a.kind === "npc")) {
          let o = a.lx != null && Math.abs(a.x - a.lx) + Math.abs(a.y - a.ly) > 0.02;
          if (o) {
            let l = a.x - a.lx,
              d = a.y - a.ly;
            a.dir = Math.abs(l) > Math.abs(d) ? (l > 0 ? "right" : "left") : d > 0 ? "down" : "up";
          }
          (a.lx = a.x),
            (a.ly = a.y),
            dS(e, ha(a.npc || "sailor", a.dir || "down", o ? "walk" : a.state || "idle", Math.floor(a.t * 6) % 4), n, i + 2),
            a.carry && dS(e, Ca(a.carry), n, i - 22),
            e.restore();
          return;
        }
        if (a.kind === "pet") {
          dS(e, pa(a.pet, a.dir || "down", a.pose || "sit"), n, i + 2), e.restore();
          return;
        }
        if (a.kind === "ship") {
          let PI = Math.PI,
            rr = ((((a.rot || 0) + PI) % (2 * PI)) + 2 * PI) % (2 * PI) - PI,
            ori = Math.abs(rr) <= PI / 4 ? "up" : Math.abs(rr) >= (3 * PI) / 4 ? "down" : rr > 0 ? "right" : "left",
            base = { up: 0, right: PI / 2, down: PI, left: -PI / 2 }[ori],
            res = ((((rr - base + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI,
            tilt = Math.max(-0.3, Math.min(0.3, res * 0.6)),
            o = Ht(a.level || 2, a.damage || "healthy", a.style, ori),
            cv = a._cv && a._cv.width === o.w && a._cv.height === o.h ? a._cv : (a._cv = Qe(o.w, o.h)),
            c2 = cv.getContext("2d"),
            items = [],
            toUs = a.x > this.ship.x ? "left" : "right";
          c2.clearRect(0, 0, o.w, o.h);
          a.crewNpc &&
            a.crewNpc.forEach((l, d) => {
              let p = o.stations[(d * 3 + 1) % o.stations.length];
              items.push({ y: p.y, fn: () => dS(c2, ha(l, d % 3 === 2 ? "down" : toUs, a.agitated ? "react" : "idle"), p.x, p.y + 2) });
            });
          a.loot &&
            a.loot.forEach((l, d) => {
              let p = o.cargoSlots[d % o.cargoSlots.length];
              items.push({ y: p.y + 4, fn: () => dS(c2, Ca(l), p.x, p.y + 6) });
            });
          shipCompose(c2, o, a.sails === "furled" ? "furled" : "full", items, this.t + (a.x || 0), { sailAlpha: () => (a.sails === "furled" ? 1 : 0.9) });
          if (
            (e.translate(n, i),
            e.rotate(tilt),
            e.scale(a.scale, a.scale),
            e.drawImage(cv, -Math.round(o.center.x), -Math.round(o.center.y)),
            e.restore(),
            a.fire && N.fire(e, n + (a.fire.dx || 0), i + (a.fire.dy || 0), this.t, { n: 14, w: 20, h: 14 }),
            a.hooks)
          )
            for (let l of a.hooks)
              if (l.plank) {
                for (let d = -2; d <= 2; d++) ce(e, r.x + l.x0, r.y + l.y0 + d, r.x + l.x1, r.y + l.y1 + d, Math.abs(d) === 2 ? "#3a2412" : d === -1 ? "#c89a62" : "#a87a4a");
                ce(e, r.x + l.x0, r.y + l.y0 + 3, r.x + l.x1, r.y + l.y1 + 3, "rgba(20,10,4,0.3)");
              } else ce(e, r.x + l.x0, r.y + l.y0, r.x + l.x1, r.y + l.y1, "#3a2a1a"), ce(e, r.x + l.x0, r.y + l.y0 - 1, r.x + l.x1, r.y + l.y1 - 1, "#c8a070");
          if (a.walkers)
            for (let l of [...a.walkers].sort((A, B) => A.y - B.y))
              (e.fillStyle = "rgba(20,10,4,0.22)"),
                e.fillRect(Math.round(r.x + l.x - 4), Math.round(r.y + l.y), 8, 2),
                dS(e, ha(l.npc, l.dir || "down", l.path && l.path.length ? "walk" : "idle", Math.floor((l.ft || 0) * 6) % 4), r.x + l.x, r.y + l.y + 2),
                l.carry && dS(e, Ca(l.carry), r.x + l.x, r.y + l.y - 22);
          return;
        }
        if (a.kind === "wave") {
          e.restore(), N.wave(e, 0, i, this.t, { W: this.W });
          return;
        }
        if (a.kind === "flag") {
          e.restore();
          return;
        }
        let s = N[a.kind];
        if (s) {
          let o = { W: this.W || 640, H: this.H || 360, ...(a.opts || {}) };
          a.scale !== 1 ? (e.translate(n, i), e.scale(a.scale, a.scale), s(e, 0, 0, this.t, o)) : s(e, n, i, this.t, o);
        }
        e.restore();
      }
      drawFx(e, a, r) {
        var l;
        if (a.type === "p") {
          (e.globalAlpha = Math.max(0, a.life / a.max)),
            (e.fillStyle = a.col),
            e.fillRect(Math.round(r.x + a.x), Math.round(r.y + a.y), a.size, a.size),
            (e.globalAlpha = 1);
          return;
        }
        let n = Math.max(0, Math.min(1, a.t / a.dur));
        if (a.t < 0) return;
        let i = r.x + a.from.x + (a.to.x - a.from.x) * n,
          s = r.y + a.from.y + (a.to.y - a.from.y) * n,
          o = Math.sin(n * Math.PI) * ((l = a.arc) != null ? l : 14);
        if (a.type === "proj") {
          a.kind !== "rope" && ((e.fillStyle = "rgba(0,0,0,0.22)"), e.fillRect(Math.round(i - 2), Math.round(s + 2), 4, 2));
          a.kind === "ball"
            ? (H(e, i, s - o - 2, 2, "#141418"), m(e, i - 1, s - o - 3, "#6a6a76"), m(e, i - 3 * Math.sign(a.to.x - a.from.x || 1), s - o - 2, "rgba(200,200,200,0.5)"))
            : a.kind === "arrow"
              ? (ce(e, i - 3, s - o - 2, i + 3, s - o - 2, "#e8e0c8"), m(e, i + (a.to.x > a.from.x ? 4 : -4), s - o - 2, "#9aa1a8"), m(e, i + (a.to.x > a.from.x ? -4 : 4), s - o - 3, "#c8423b"))
              : a.kind === "chest"
                ? dS(e, Ca("GOOD_GOLD_BAR"), i, s - o)
                : a.kind === "crate"
                  ? dS(e, Ca(a.good || "GOOD_SPICE"), i, s - o)
                  : a.kind === "rope"
                    ? (ce(e, r.x + a.from.x, r.y + a.from.y - 6, i, s - 2, "#c8a070"), ce(e, r.x + a.from.x, r.y + a.from.y - 5, i, s - 1, "#8a6a40"))
                    : a.kind === "flare" && (H(e, i, s - o - 2, 2, "#ff6040"), m(e, i, s - o - 2, "#fff0a0"), m(e, i - 1, s - o + 1, "rgba(255,200,120,0.6)"), m(e, i + 1, s - o + 3, "rgba(255,200,120,0.4)"));
        } else
          a.type === "coin"
            ? (b(e, i - 1, s - o * 0.8 - 2, 2, 3, a.col), m(e, i, s - o * 0.8 - 1, "#b8862b"), m(e, i - 1, s - o * 0.8 - 2, "#fff6c0"))
            : a.type === "icon" && e.drawImage(vt(a.icon), Math.round(i - 8), Math.round(s - o - 13));
      }
