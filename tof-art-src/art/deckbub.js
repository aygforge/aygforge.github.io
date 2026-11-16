      bubblePositions() {
        return this.bubbles
          .map((e) => {
            let a = this.actors.get(e.id) || this.temp.find((r) => r.id === e.id);
            return a ? { text: e.text, x: a.vx != null ? a.vx : a.x, y: (a.vy != null ? a.vy : a.y - 9) - (a.kind === "crew" || a.kind === "captain" || a.kind === "npc" ? 15 : 8) } : null;
          })
          .filter(Boolean);
      }
