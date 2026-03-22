import Phaser from 'phaser'

// Module-level singleton for Phaser↔React communication
// TownScene emits: EventBus.emit('dungeon-enter')
// GamePage listens: EventBus.on('dungeon-enter', handler)
const EventBus = new Phaser.Events.EventEmitter()

export default EventBus
