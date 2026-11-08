// Scene transitions with return anchors and PREPARED→COMMITTED checkpoints (SceneFlow.json).
export class SceneRouter {
  constructor(game) { this.g = game; }
  get s() { return this.g.store.state; }

  transition(event, toScene, destPx, mode = 'WALK') {
    const st = this.s.sessionTransition;
    const id = `TR:${event}:${this.s.clock.gameElapsedSeconds | 0}:${(st.counter || 0) + 1}`;
    Object.assign(st, { status: 'PREPARED', transitionId: id, fromScene: this.s.player.sceneId, toScene, destinationPx: destPx, destinationMode: mode, counter: (st.counter || 0) + 1, snapshotRevisionOnPrepare: this.s.revision });
    this.g.persistence?.checkpoint('transition_prepared');
    this.g.world.teleport(toScene, destPx[0], destPx[1], mode);
    st.status = 'COMMITTED';
    this.g.persistence?.checkpoint('transition_committed');
    this.g.bus.emit('transition', { event, toScene });
  }

  /** On load: a PREPARED transition is resolved deterministically to its destination (one consistent scene). */
  recover() {
    const st = this.s.sessionTransition;
    if (st.status === 'PREPARED' && st.destinationPx) {
      this.s.player.sceneId = st.toScene; this.s.player.positionPx = [...st.destinationPx]; this.s.player.mode = st.destinationMode || 'WALK';
      st.status = 'COMMITTED';
      return true;
    }
    return false;
  }
}
