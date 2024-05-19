import * as THREE from 'three';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Viewer {
  public scene = new THREE.Scene();
  public renderer !: WebGLRenderer;
  public camera !: PerspectiveCamera;
  private defaultUp = new THREE.Vector3(0,0,1);
  public container : HTMLDivElement;
  public orbit_controls : OrbitControls;
  public transform_controls : TransformControls;

  private createRenderer() : void {
    this.renderer = new WebGLRenderer({alpha: true, 
                                      logarithmicDepthBuffer:true, 
                                      antialias:true})
    this.renderer.localClippingEnabled  = true;
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  public createScene() : THREE.Scene {
    let scene = new THREE.Scene();
    scene.background = new THREE.Color('#212529');
    scene.up.copy(this.defaultUp)
    const grid = new THREE.GridHelper(10,10);
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);
    grid.geometry.rotateX( Math.PI / 2 );

    return scene
  }

  public get domElement (): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public createOrbitControls(x : number = 0, y : number = 0, z: number = 0) : void {
    this.orbit_controls = new OrbitControls(this.camera, this.domElement);
    this.orbit_controls.mouseButtons = {
      RIGHT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN
    }
    this.orbit_controls.target.set( x, y, z );
    this.orbit_controls.update();
  }
  
  public createTransformControls() : void {
    this.transform_controls = new TransformControls(this.camera, this.domElement);
  }

  public createPerspectiveCamera( x : number = 0,
                                  y : number = 0,
                                  z : number = 0,
                                  zoom : number = 1
                                ) 
                                  : THREE.PerspectiveCamera 
  {
    let camera = new PerspectiveCamera(75, this.container.offsetWidth / 
                                       this.container.offsetHeight, 0.1, 1000)
    camera.lookAt(x, y, z)
    camera.name = "MainCamera"
    camera.up.copy(this.defaultUp);
    camera.position.z = z + 10;
    camera.position.y = y - 10;
    camera.position.x = x -10;
    camera.lookAt(x,y,z)
    camera.zoom = zoom;
    return camera
  }
  public sun: any
  public sunTarget : any

  private addDirectLights(){
      const amb = new THREE.AmbientLight(0xffffff, 1);
      this.scene.add(amb);
      //this.scene.add(light);

      this.sun = new THREE.DirectionalLight(0xffffff, 10)
      this.sun.name = 'sun'
      //this.sun.layers.set(ObjectLayers.STREAM_CONTENT)
      this.scene.add(this.sun)

      this.sun.castShadow = true

      this.sun.shadow.mapSize.width = 2048
      this.sun.shadow.mapSize.height = 2048

      const d =50
      this.sun.position.set(100,100,100);
      this.sun.shadow.camera.left = -d
      this.sun.shadow.camera.right = d
      this.sun.shadow.camera.top = d
      this.sun.shadow.camera.bottom = -d
      this.sun.shadow.camera.near = 5
      this.sun.shadow.camera.far = 350
      this.sun.shadow.bias = -0.001
      this.sun.shadow.radius = 2
      this.sunTarget = new THREE.Mesh(new THREE.SphereGeometry());
      this.sunTarget.visible = false;
      this.sun.target = this.sunTarget
      this.scene.add(this.sun.target);
  }


  animate(){
      this.renderer.setAnimationLoop(()=>{
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    });
  }

  public constructor(element : HTMLDivElement){
    this.container = element;
    this.createRenderer();
    this.camera = this.createPerspectiveCamera();
    this.createOrbitControls();
    this.createTransformControls();
    this.scene = this.createScene();
    this.addDirectLights();
    this.animate();
    console.log(this)
  }
}

