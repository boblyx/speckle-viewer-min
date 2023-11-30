import { Component, onMount, createSignal} from 'solid-js';
import { convertSpeckleObject, addSpeckleStream } from './SpeckleLoader';

import logo from './logo.svg';
import styles from './App.module.css';
import {Viewer} from './Viewer';

export const [viewport, setViewport] = createSignal<Viewer>();
async function test(){
  await addSpeckleStream();
  //convertSpeckleObject();
}
const App: Component = () => {

  onMount( () => {
    const view3D = document.querySelector("#view3D") as HTMLDivElement
    if(view3D){
      const VP = new Viewer(view3D);
      setViewport(VP);
      view3D.appendChild(VP.domElement);
    }
  });
  return (
    <>
      <div class={styles.App}>
        <button onclick={async ()=> await test()}>Load Speckle</button>
      </div>
      <div id = "view3D" style="margin-top:20px;width:100svw;height:600px;background-color:#000000">

      </div>
    </>
  );
};

export default App;
