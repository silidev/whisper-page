var v={fieldSeparator:",",decimalSeparator:".",quoteStrings:!0,quoteCharacter:'"',showTitle:!1,title:"My Generated Report",filename:"generated",showColumnHeaders:!0,useTextFile:!1,useBom:!0,columnHeaders:[],useKeysAsHeaders:!1,boolDisplay:{true:"TRUE",false:"FALSE"},replaceUndefinedWith:""},S="\r\n",T="\uFEFF",Z=(x)=>Object.assign({},v,x);class _ extends Error{constructor(x){super(x);this.name="CsvGenerationError"}}class q extends Error{constructor(x){super(x);this.name="EmptyHeadersError"}}class G extends Error{constructor(x){super(x);this.name="CsvDownloadEnvironmentError"}}var W=(x)=>x,z=(x)=>x,X=W,Y=W,Q=W,B=W;var m=function(x,A){if(A=='"'&&x.indexOf('"')>-1)return x.replace(/"/g,'""');return x},H=(x)=>typeof x==="object"?Q(x.key):Q(x),D=(x)=>typeof x==="object"?B(x.displayLabel):B(x),F=(x,...A)=>A.reduce(($,j)=>j($),x),K=(x)=>(A)=>x.useBom?X(z(A)+T):A,L=(x)=>(A)=>x.showTitle?X(z(A)+x.title):A,O=(x)=>(A)=>X(z(x)+z(A)+S),P=(x)=>(A,$)=>y(x)(Y(A+$)),y=(x)=>(A)=>W(z(A)+x.fieldSeparator),E=(x,A)=>($)=>{if(!x.showColumnHeaders)return $;if(A.length<1)throw new q("Option to show headers but none supplied. Make sure there are keys in your collection or that you've supplied headers through the config options.");let j=Y("");for(let I=0;I<A.length;I++){const N=D(A[I]);j=P(x)(j,b(x,N))}return j=Y(z(j).slice(0,-1)),O($)(j)},R=(x,A,$)=>(j)=>{let I=j;for(var N=0;N<$.length;N++){let U=Y("");for(let J=0;J<A.length;J++){const M=H(A[J]),C=typeof $[N][z(M)]==="undefined"?x.replaceUndefinedWith:$[N][z(M)];U=P(x)(U,b(x,C))}U=Y(z(U).slice(0,-1)),I=O(I)(U)}return I},h=z,V=(x)=>+x===x&&(!isFinite(x)||Boolean(x%1)),b=(x,A)=>{if(x.decimalSeparator==="locale"&&V(A))return A.toLocaleString();if(x.decimalSeparator!=="."&&V(A))return A.toString().replace(".",x.decimalSeparator);if(typeof A==="string"){let $=A;if(x.quoteStrings||x.fieldSeparator&&A.indexOf(x.fieldSeparator)>-1||x.quoteCharacter&&A.indexOf(x.quoteCharacter)>-1||A.indexOf("\n")>-1||A.indexOf("\r")>-1)$=x.quoteCharacter+m(A,x.quoteCharacter)+x.quoteCharacter;return $}if(typeof A==="boolean"&&x.boolDisplay){const $=A?"true":"false";return x.boolDisplay[$]}return A};var Ix=(x)=>(A)=>{const $=Z(x),j=$.useKeysAsHeaders?Object.keys(A[0]):$.columnHeaders;let I=F(X(""),K($),L($),E($,j),R($,j,A));if(z(I).length<1)throw new _("Output is empty. Is your data formatted correctly?");return I},Jx=(x)=>(A)=>{if(!window)throw new G("Downloading only supported in a browser environment.");const $=Z(x),j=z(A),I=$.useTextFile?"plain":"csv",N=$.useTextFile?"txt":"csv";let U=new Blob([j],{type:`text/${I};charset=utf8;`}),J=document.createElement("a");J.download=`${$.filename}.${N}`,J.href=URL.createObjectURL(U),J.setAttribute("visibility","hidden"),document.body.appendChild(J),J.click(),document.body.removeChild(J)};export{Z as mkConfig,Ix as generateCsv,Jx as download,h as asString};
