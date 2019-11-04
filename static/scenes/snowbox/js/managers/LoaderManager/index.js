import WRLLoader from '../../components/WRLLoader/index.js'

class LoaderManager {
  constructor() {
    this.subjects = {}

    this.textureLoader = new THREE.TextureLoader()
    this.OBJLoader = new THREE.OBJLoader()
    this.WRLLoader = new WRLLoader()

    this.load = this.load.bind(this)
  }

  load(object, callback) {
    // if element already loaded, callback directly
    if (this.subjects[object.name]) {
      callback()
      return
    }

    // else, wait for all objects of the element to be loaded
    const { name, normalMap, obj, wrl, skybox } = object
    const promises = []

    this.subjects[name] = {}

    if (normalMap) {
      promises.push(this.loadTexture(normalMap, name, 'normalMap'))
    }

    if (obj) {
      promises.push(this.loadOBJ(obj, name))
    }

    if (wrl) {
      promises.push(this.loadWRL(wrl, name))
    }

    if (skybox) {
      if (!this.subjects[name].textures) {
        this.subjects[name].textures = []
      }

      const { prefix, directions, suffix } = skybox
      for (let i = 0; i < 6; i++) {
        promises.push(this.loadTexture(prefix + directions[i] + suffix, name, 'skybox', i))
      }
    }

    Promise.all(promises).then(callback)
  }

  loadOBJ(url, name) {
    return new Promise(resolve => {
      this.OBJLoader.load(url, result => {
        this.subjects[name].obj = result
        resolve(result)
      })
    })
  }

  loadWRL(url, name) {
    return new Promise(resolve => {
      this.WRLLoader.load(url).then(result => {
        this.subjects[name].wrl = result
        resolve(result)
      })
    })
  }

  loadTexture(url, name, type, order = null) {
    return new Promise(resolve => {
      this.textureLoader.load(url, result => {
        if (type === 'skybox') {
          // push texture in a array
          result.order = order
          this.subjects[name].textures.push(result)
        } else {
          this.subjects[name][type] = result
        }
        resolve(result)
      })
    })
  }
}


export default new LoaderManager()