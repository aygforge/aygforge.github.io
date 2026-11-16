      for (let n of this.ambient)
        if (n.kind === "gulls")
          for (let i = 0; i < n.n; i++) {
            let s = n.x + i * 14 + Math.sin(n.t + i) * 4,
              o = n.y + (i % 2) * 9,
              l = Math.sin(n.t * 8 + i) > 0 ? "fly0" : "fly1";
            (e.fillStyle = "rgba(0,0,0,0.16)"), e.fillRect(Math.round(s - 3), Math.round(o + 20), 7, 2);
            dS(e, pa("PET_MARTI", n.vx > 12 ? "right" : n.vx < -12 ? "left" : "down", l), s, o);
          }
