goog.provide('app.Table')

goog.require('Constants')

goog.require('app.Entity')
goog.require('app.shared.pools');
goog.require('Utils')

app.Table = class Table extends app.Entity {
  constructor(game, config) {
    super(game)
    this.config = config
    this.gameControls = game.controls

    this.elem = document.createElement('div')
    document.getElementById('tables').append(this.elem)
    this.elem.setAttribute('class', 'table')
  }

  onInit(config) {
    config.width = Constants.TABLE_WIDTH
    config.height = Constants.TABLE_HEIGHT

    super.onInit(config)
    this.config.triggerAction = 'on-border'
  }

  render() {
    Utils.renderAtGridLocation(this.elem, this.config.x, this.config.y)
  }

  onContact(player) {
    let actions = []

    if (Utils.isInBorder(this.config, player.position)) {
      actions = [Constants.PLAYER_ACTIONS.BLOCK]
      if (Constants.DEBUG) {
        this.elem.style.opacity = 0.5
      }

      if (this.gameControls.isKeyControlActive(player.controls.action)) {
        actions = [Constants.PLAYER_ACTIONS.ADD_TOY_PART, Constants.PLAYER_ACTIONS.BLOCK]
      }
    } else if (Constants.DEBUG) {
      this.elem.style.opacity = 1
    }

    return actions
  }
}

app.shared.pools.mixin(app.Table)
