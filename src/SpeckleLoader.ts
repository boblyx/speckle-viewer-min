import ObjectLoader from "@speckle/objectloader";
import Batcher from "./modules/batching/Batcher";
import {WorldTree} from "./modules/tree/WorldTree";
import ViewerObjectLoader from "./modules/ViewerObjectLoader";
import { SpeckleTypeAllRenderables } from './modules/converter/GeometryConverter'
import { viewport } from "./App";
import {Viewer} from "./Viewer";
import * as THREE from "three";

const eg_url = 'http://dpa-compute1.dpa.com.sg/streams/50bb061b20/objects/1507654f33b5d01c526e64f9eea93856';
const eg_stream = 'http://dpa-compute1.dpa.com.sg/streams/50bb061b20/commits/f507b65802';

async function querySpeckleObjects(streamurl : string){
  if(String(streamurl)==""){return []}
  let stream_parts = String(streamurl).split("/",5);
  let b_url =stream_parts[0]+"//"+stream_parts[2] 
  let url = b_url+"/"+"graphql";
  let stream_id = stream_parts[stream_parts.length-1];
  let _query="query{stream(id: \""+stream_id+"\"){branch(name:\"main\"){commits{items{referencedObject}}}}}";

  let jsonq = 
  {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({query: _query})
  };

  let objectlist : any[] = [];
  await fetch(url,jsonq)
  .then((res)=>res.json())
  .then((result)=> {
    let itemlist = result.data.stream.branch.commits.items;
    objectlist = itemlist
  });

  if(objectlist.length ==0){return [];}
  let objurls = [];

  for(let i = 0; i < objectlist.length; i++){
    let o_url = b_url+"/streams/"+stream_id+"/objects/"+objectlist[i].referencedObject;
    let options = JSON.stringify({
      objectUrl: o_url,
    });
    objurls.push(options);
  }
  console.log(objurls)
  return objurls
}

export async function addSpeckleStream(commit_url = eg_stream){

  commit_url = prompt("Please enter speckle commit url", eg_stream)
  if(commit_url == null){
    console.log("Cancelled")
    return 0
  }

  if(!(commit_url.includes("object") || commit_url.includes("streams"))){
    console.log("invalid link")
    return 0
  }
  let options;
  let options_list = []

  if(commit_url.includes("object")){
    options = JSON.stringify({
      objectUrl: commit_url,
    });
    options_list.push(options)

  }else{
    options_list = await querySpeckleObjects(commit_url)
    if (options_list.length == 0){
      console.log("No objects in speckle stream!")
      return 0
    }
  }
  console.log(options_list);
  for(let i = 0; i < options_list.length; i++){
    let c_opt = JSON.parse(options_list[i]);
    //console.log(c_opt["objectUrl"]);
    try{
      await convertSpeckleObject(c_opt["objectUrl"]);
    }catch(err){
	  await convertSpeckleObject(c_opt["objectUrl"]);
      console.log(err);
    }
  }
}

export async function convertSpeckleObject(objectUrl : string = eg_url,
                                           authtoken : any = null,
                                           enableCaching : boolean = true){
  let tree = new WorldTree();
  let loader = new ViewerObjectLoader(tree, objectUrl, authtoken, enableCaching);
  console.log("Loading!");
  await loader.load();
  loader.tree.getRenderTree().buildRenderTree();
  const batcher = new Batcher(100000, true);
  try{
  await batcher.makeBatches(loader.tree.getRenderTree(), SpeckleTypeAllRenderables);
  Object.values(batcher.batches).forEach( (b : any) => {
    console.log(b)
    if(b.geometry){
      const material = new THREE.MeshPhongMaterial( { color: b.batchMaterial.color } );
      material.side = THREE.DoubleSide;
      const mesh = new THREE.Mesh(b.geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      viewport().scene.add(mesh);
      //viewport().scene.add(b.renderObject); // Somehow this doesn't work and requires speckle's renderer
    }
  });
  }catch(err){}
  console.log(viewport().scene);
  console.log("Done");
}
