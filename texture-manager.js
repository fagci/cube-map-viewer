class TextureManager {
  constructor (basePath, loadingSelector, progressBarSelector) {
    this.loadManager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.loadManager).setPath(basePath)
    this.loadingElem = document.querySelector(loadingSelector);
    this.progressBarElem = this.loadingElem.querySelector(progressBarSelector);

    this.loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
      this.progressBarElem.style.transform = `scaleX(${itemsLoaded / itemsTotal})`;
    };

    this.loadManager.onLoad = () => {  
      this.loadingElem.style.display = 'none';
    }
  }

  load (path, cbLoad, cbProgress, cbError) {
    return this.textureLoader.load(path, cbLoad, cbProgress, cbError)
  }
}