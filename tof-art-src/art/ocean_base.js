      drawBase(e, a, r) {
        let n = zo[this.preset] || zo.calm;
        di(e, ci(n, 0), a, r, Math.sin(this.t * 0.2) * 3, this.offset * 0.85),
          di(e, ci(n, 1, Math.floor(this.t * 1.4) % 2), a, r, Math.sin(this.t * 0.35) * 4, this.offset),
          di(e, ci(n, 2, Math.floor(this.t * 2.1) % 2), a, r, 40 + Math.sin(this.t * 0.5) * 5, this.offset * 1.08 + 50);
        for (let i of this.clouds) ve(e, i.x, i.y, i.r, i.r * 0.55, "rgba(10,20,40,0.10)");
        for (let i of this.ambient) i.air || this.drawAmbient(e, i);
        // dümen suyu: köpük çizgileri
        for (let i of this.wake) {
          let s = Math.max(0, Math.min(1, i.life / i.max));
          (e.fillStyle = `rgba(240,250,255,${0.78 * s})`), e.fillRect(Math.round(i.x), Math.round(i.y), i.s + (s > 0.5 ? 2 : 1), 1), i.s > 1 && e.fillRect(Math.round(i.x) + 1, Math.round(i.y) + 1, 2, 1);
        }
      }
