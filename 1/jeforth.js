/*
	jeForth
    A minimalist Forth Implementation in Javascript
    BSD license
	
	2011/12/23  initial version by yapcheahshen@gmail.com
	            equiv to http://tutor.ksana.tw/ksanavm lesson1~8
	            
    TODO: complete eForth core word set
          interface to HTML5 canvas
          port C.H.Ting flag demo for kids
          
    this is merely a kick off, everyone is welcome to enhance it.
*/
"uses strict";
(function() {
	/*	global variable for all instances of KsanaVm 	*/
	function KsanaVm(dictsize) {
	/*	private members for KsanaVm instance*/
	var ip=0; // instruction pointer
	var abortexec=false;
	dictsize = dictsize || 0xfff;  // default 4095 cells ( must be 0xFF , 0xFFF , 0x1FF for & in execprimitive )
	var dictionary = new Array(dictsize+1) ;//Uint32Array(dictsize+1);  // Typed Array for faster memory access
	var stack = [] , rstack =[]; // change to fix length Typed Array for faster speed
	var tib="", ntib=0 , here=0;
	var compiling=false;
    this.ticktype=0; // 'type vector
    var newname,newxt; // for word under construction
    
function cr() {	systemtype("\n"); }
function systemtype(t) {if (ticktype) ticktype(t);}
function panic(msg) {
	systemtype(msg);
	reset();
}

function nexttoken() {
	var token="";
	while (tib.substr(ntib,1)==' ') ntib++;
	while (ntib<tib.length && tib.substr(ntib,1)!=' ') token+=tib.substr(ntib++,1);
	return token;
}
function dictcompile(n) {dictionary[here++]=n;} 

function reset() {
	abortexec=1;
	stack=[];
	rstack=[];
}

function findword(name) {
	for (var i=words.length-1;i>0;i--) {
		if (words[i].name===name)  return i;
	}
	return -1;
}
/* in dictionary, primitive words have the format of 0x40000000+index in words */
function isprimitive(addr) { return (addr & 0x40000000);}
function execprimitive(addr) {words[addr & dictsize].xt() ;}
function compilecode(nword) { 
  if ( typeof(nword) ==="string" ) nword=findword(nword); // compilecode("wordname") , find out the word index by name

  if ( typeof(words[nword].xt) ==="function" ) {      
    dictcompile( 0x40000000 | nword);    // a primitive, xt is a function 
  } else { 
    dictcompile(words[nword].xt) ;   // high level words , xt is a number
  }
}

function execute(xt) {               // run a word 
	if (typeof(xt)==="function") xt() ;  // primitive , execute it directly
	else {	call(xt);}        // make a high level call
}
function call(address) {   // inner loop 
	abortexec=false;
	ip=address;
	do {
		addr=dictionary[ip++];    // go to next cell
		if (isprimitive(addr)) {
			execprimitive(addr); // a primitive
		} else {
			rstack.push(ip);                             
			call(addr);
		}	
	} while (!abortexec);
}
function ret() {   // high level return
	if (rstack.length===0) {
		abortexec=true;
		return;
    }
	ip=rstack.pop();
}
	
function exec(cmd) {   // outer loop
	tib=cmd;
	ntib=0;
	do {
	  var token=nexttoken();
	  if (token==="") break;
	  var n=parseInt(token);  // convert to number, javascript allow parseInt(str,base)
	  var nword=findword(token);
	  if (nword>-1) { 
	      var w=words[nword]; 
	  	  if (compiling && !w.immediate) {
	  	  	 compilecode(nword);
	      } else {
	         execute( w.xt);                              
	      }
       } else if (n) {    // if the token is a number
          if (compiling) {	
            compilecode("dolit");    // compile an literal
            dictcompile(n);
          } else { 	
            stack.push(n);  
          }
      } else {
        panic("? "+token);
	  }
	} while (true) ;
	cr();
	
}
  var words = [
    {name:"here" ,xt:function(){stack.push(here);}}
   ,{name:","    ,xt:function(){dictcompile(stack.pop());}}
   ,{name:"dolit",xt:function(){stack.push(dictionary[ip++]);}}
   ,{name:"ret"  ,xt:function(){ret();}}
   ,{name:":"    ,xt:function(){newname=nexttoken();newxt=here; compiling=true; }}
   ,{name:";"    ,xt:function(){compiling=false; compilecode("ret"); words.push({name:newname,xt:newxt}) } , immediate: true }
   ,{name:"*"    ,xt:function(){stack.push(stack.pop()*stack.pop());}}
   ,{name:"."    ,xt:function(){systemtype(stack.pop()+" ");}}
   ,{name:"dup"  ,xt:function(){stack.push(stack[stack.length-1]);}}
  ]
  
  this.exec= exec;  // make exec become a public interface
}
window.KsanaVm=KsanaVm;  // export KsanaVm as a global variable
})();