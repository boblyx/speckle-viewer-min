import ObjectLoader from '@speckle/objectloader'
import Converter from './converter/Converter'
import Logger from 'js-logger'
import { WorldTree } from './tree/WorldTree'
export default class ViewerObjectLoader {
  private _objectUrl: string
  private objectId: string
  private token: string
  private loader: ObjectLoader
  private converter: Converter
  private cancel = false
  private _tree : WorldTree
  public get objectUrl(): string {
    return this._objectUrl
  }
  public get tree() : WorldTree {
    return this._tree;
  }
  constructor(tree: WorldTree, objectUrl : string, authToken : any, enableCaching : any){
    this._tree = tree;
    this._objectUrl = objectUrl
    this.token = null as any
	try {
      this.token = authToken || localStorage.getItem('AuthToken')
    } catch (error) {
      // Accessing localStorage may throw when executing on sandboxed document, ignore.
    }
	if (!this.token) {
      Logger.error(
        'Viewer: no auth token present. Requests to non-public stream objects will fail.'
      )
    }
	// example url: `http://dpa-compute1.dpa.com.sg/streams/50bb061b20/objects/1507654f33b5d01c526e64f9eea93856`
	const url = new URL(objectUrl)
	const segments = url.pathname.split('/')
    if (
      segments.length < 5 ||
      url.pathname.indexOf('streams') === -1 ||
      url.pathname.indexOf('objects') === -1
    ) {
      throw new Error('Unexpected object url format.')
    }
	
	const serverUrl = url.origin
    const streamId = segments[2]
    this.objectId = segments[4]

    this.loader = new ObjectLoader({
      serverUrl,
      token: this.token,
      streamId,
      objectId: this.objectId,
      options: { enableCaching, customLogger: (Logger as any).log }
    })
    this.converter = new Converter(this.loader, this._tree)//parent.getWorldTree())

    this.cancel = false
  }
  
  public async load() {
    const start = performance.now()
    let first = true
    let current = 0
    let total : any = 0
    let viewerLoads = 0
    let firstObjectPromise = null
    for await (const obj of this.loader.getObjectIterator()) {
      if (this.cancel) {return}

      await this.converter.asyncPause()
      if (first) {
        firstObjectPromise = this.converter.traverse(this.objectUrl, obj, async () => {
          await this.converter.asyncPause()
          // objectWrapper.meta.__importedUrl = this.objectUrl
          viewerLoads++
        })
          first = false
          total = obj.totalChildrenCount
      }
      current++
    }
    if (firstObjectPromise) {
      await firstObjectPromise
    }
    Logger.warn(
      `Finished downloading object ${this.objectId} in ${
        (performance.now() - start) / 1000
      } seconds`
    )
    if (viewerLoads === 0) {
      Logger.warn(`Viewer: no 3d objects found in object ${this.objectId}`)
    }
  }
  cancelLoad() {
    this.cancel = true
  }

  dispose() {
    this.loader.dispose()
  }
}
