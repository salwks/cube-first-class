export const faces=['U','R','F','D','L','B'];
export const normals={U:[0,1,0],R:[1,0,0],F:[0,0,1],D:[0,-1,0],L:[-1,0,0],B:[0,0,-1]};
export const axes={U:['y',1,-1],D:['y',-1,1],R:['x',1,-1],L:['x',-1,1],F:['z',1,-1],B:['z',-1,1]};
export function position(face,row,col){return {U:[col-1,1,row-1],D:[col-1,-1,1-row],F:[col-1,1-row,1],B:[1-col,1-row,-1],R:[1,1-row,1-col],L:[-1,1-row,col-1]}[face];}
