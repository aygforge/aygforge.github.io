      items(e, a = "deck") {
        if (!this.ship) return [];
        let out = [],
          r = [...this.actors.values(), ...this.temp].filter((n) => !n.hidden && (a === "air") == (n.kind === "parrot" || !!n.z));
        for (let n of r) {
          let s = n.x,
            o = n.y,
            lift = 0;
          if (n.state === "climb") {
            let l = this.ship.masts.find((d) => Math.abs(d.y - n.y) < 14) || this.ship.masts[0];
            (s = l.x + 3), (o = l.y), (lift = 26 + Math.round(Math.sin(this.time * 2)));
          }
          if (n.kind === "parrot") {
            let ph = n.perch ? (n.perch.follow ? 17 : n.perch.h || 0) : 0;
            if (n.state === "fly") {
              let q = Math.min(1, (n.flyT || 0) / (n.flyDur || 1));
              lift = (n.fromH || 0) + (ph - (n.fromH || 0)) * q + Math.sin(q * Math.PI) * 10;
            } else (lift = ph), (n.fromH = ph);
          } else if (n.ride) lift = 15;
          (n.vx = s), (n.vy = o - lift - 9);
          out.push({
            y: o + (n.ride ? 0.4 : 0),
            fn: () => {
              let i = this.frameOf(n);
              a === "deck"
                ? ((e.fillStyle = "rgba(20,10,4,0.26)"), e.fillRect(Math.round(s - 4), Math.round(o), 8, 2), e.fillRect(Math.round(s - 3), Math.round(o + 2), 6, 1))
                : n.kind === "parrot" && n.state === "fly" && ((e.fillStyle = "rgba(20,10,4,0.18)"), e.fillRect(Math.round(s - 3), Math.round(o), 6, 2));
              dS(e, i, s, o + 2 - lift - (n.hop || 0));
              let top = o - lift - (n.kind === "crew" || n.kind === "captain" || n.kind === "npc" ? 24 : 12);
              n.carry === "bone" && ((e.fillStyle = "#f4ead5"), e.fillRect(Math.round(s - 3), Math.round(o - 9), 6, 2), e.fillRect(Math.round(s - 4), Math.round(o - 10), 2, 4), e.fillRect(Math.round(s + 2), Math.round(o - 10), 2, 4));
              n.carry === "crate" && n.crateGood && dS(e, Ca(n.crateGood), s, top + 2);
              n.carry === "chest" && dS(e, Ca("GOOD_GOLD_BAR"), s, top + 2);
              n.state === "sleep" &&
                Math.floor(this.time * 1.5) % 3 === 0 &&
                (m(e, s + 6, o - 12 - (this.time % 1) * 5, "#e8f0ff"), m(e, s + 7, o - 12 - (this.time % 1) * 5, "#e8f0ff"), m(e, s + 7, o - 13 - (this.time % 1) * 5, "#e8f0ff"));
            },
          });
        }
        if (a === "deck")
          for (let n of this.props)
            n.taken ||
              out.push({
                y: n.y,
                fn: () => {
                  (e.fillStyle = "rgba(20,10,4,0.2)"), e.fillRect(Math.round(n.x - 2), Math.round(n.y), 5, 1);
                  (e.fillStyle = "#f4ead5"), e.fillRect(Math.round(n.x - 3), Math.round(n.y - n.z - 1), 6, 2), e.fillRect(Math.round(n.x - 4), Math.round(n.y - n.z - 2), 2, 4), e.fillRect(Math.round(n.x + 2), Math.round(n.y - n.z - 2), 2, 4);
                },
              });
        return out;
      }
      draw(e, a = "deck") {
        let L = this.items(e, a);
        L.sort((p, q) => p.y - q.y);
        for (let k of L) k.fn();
      }
      actorAt(e, a) {
        let r = null,
          n = 14;
        for (let i of [...this.actors.values()]) {
          let s = Math.hypot((i.vx != null ? i.vx : i.x) - e, (i.vy != null ? i.vy : i.y - 9) - a);
          s < n && ((n = s), (r = i));
        }
        return r;
      }
