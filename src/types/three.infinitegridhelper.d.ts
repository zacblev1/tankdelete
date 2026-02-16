declare module '@plackyfantacky/three.infinitegridhelper' {
  import { Object3D } from 'three';

  export class InfiniteGridHelper extends Object3D {
    constructor(
      size1?: number,
      size2?: number,
      color?: any,
      distance?: number,
      axes?: string
    );
  }
}
