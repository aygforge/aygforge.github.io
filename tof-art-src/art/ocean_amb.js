        case "distantShip": {
          let r = Ht(1, "healthy", a.style, a.flip ? "down" : "up"),
            cv = shipStatic(r, "full");
          (e.globalAlpha = 0.9),
            e.save(),
            e.translate(Math.round(a.x), Math.round(a.y)),
            e.scale(0.55, 0.55),
            e.drawImage(cv, -Math.round(r.center.x), -Math.round(r.center.y)),
            e.restore(),
            (e.globalAlpha = 1);
          break;
        }
