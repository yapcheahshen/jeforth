
	/*    jeForth --- An eForth Implementation in Javascript --- BSD license
   2011/12/28 add:	0= 0< 0> 0<> 0<= 0>= = > < <> >= <= ==
					doCon constant doVar variable create allot
					@ ? ! swap nip rot pick roll >r r> r@ for next
					.r space samsuanchen@gmail.com
   2011/12/27 add:	branch 0branch if else then begin again until while repeat
					.s + 1+ 2+ - 1- 2- / mod div samsuanchen@gmail.com
			  add:	see yapcheahshen@gmail.com
              modify: see samsuanchen@gmail.com
   2011/12/26 add:	hex decimal base@ base! cr [ ] findword ' ['] words
              modify: . samsuanchen@gmail.com
   2011/12/23 initial: here , doLit exit : ; * dup drop . yapcheahshen@gmail.com
               equiv to http://tutor.ksana.tw/ksanavm lesson1~8
    TODO: complete eForth core word set
         interface to HTML5 canvas
         port C.H.Ting flag demo for kids
    This is merely a kick off, everyone is welcome to enhance it. */
(function() {
"uses strict";
 /* global members for KsanaVm instance*/
 function KsanaVm(dictsize) {
   /* private members for KsanaVm instance*/
   var ip=0; // instruction pointer
   var abortexec=false;
   dictsize=dictsize || 0xfff; // default 4095 cells ( must be 0xFF , 0xFFF , 0x1FF for & in execprimitive )
   var dictionary=new Array(dictsize+1) ;//Uint32Array(dictsize+1);  // Typed Array for faster memory access
   var stack=[], rstack=[]; // change to fix length Typed Array for faster speed
   var tib="", ntib=0, here=0, base=10;
    var newname,newxt; // for word under construction
    var compiling=false;
   this.getcompiling=function(){return compiling;} // get variable compiling
   var token="";
   this.gettoken=function(){return token;} // get variable token
    var error=false;
    this.geterror=function(){return error;} // get variable error
    this.ticktype=0; // 'type vector not defined yet
   function systemtype(t){if(ticktype)ticktype(t);}
   function redtype(t){systemtype("<font color='red'>"+t+"</font>");}
   function bluetype(t){systemtype("<font color='blue'>"+t+"</font>");}
   function greentype(t){systemtype("<font color='green'>"+t+"</font>");}
   function pinktype(t){systemtype("<font color='pink'>"+t+"</font>");}
   function cr(){systemtype("<br />\n");}
   function reset(){abortexec=true; stack=[]; rstack=[]; compiling=false;}
   function panic(msg){pinktype(msg); reset(); error=true;}
   function nexttoken(deli){
       token=""; 
       if (deli===undefined) deli=" "; 
       while(tib.substr(ntib,1)===" "  || tib.substr(ntib,1)==="\n" ) ntib++;
       
       while(ntib<tib.length && tib.substr(ntib,1)!=deli && tib.substr(ntib,1)!="\n") {
         token+=tib.substr(ntib++,1);
       }
       if (deli!=" ") ntib++;
       return token;
   }
   function dictcompile(n){dictionary[here++]=n;}
   function findword(name){for(var i=words.length-1;i>=0;i--)if(words[i].name===name)break; return i;}
   /* in dictionary, primitive words have the format of 0x40000000+index in words */
   function isprimitive(addr){return(addr & 0x40000000);}
   function execprimitive(addr){words[addr & dictsize].xt();}
   function compilecode(n){                 // ****    將 n 編入 dictionary
       if(typeof(n)==="string")n=findword(n); // compilecode("wordname") , find out the word index by name
       if(typeof(words[n].xt)==="function")
           dictcompile(0x40000000|n);                     // a primitive, xt is a function
       else dictcompile(words[n].xt);}     // high level words , xt is a number
   function execute(xt){                   // ****    執行 xt 指令
       if(typeof(xt)==="function")xt();     // 執行 xt 低階指令 execute a low level primitive
       else   call(xt);
                            // 呼叫 xt 高階指令 call a high level definition
  };
   function call(xt){                        // *** 呼叫 xt 高階指令
       abortexec=false; ip=xt; // inner loop
       do{    var addr=dictionary[ip++];                      // go to next cell
           if(isprimitive(addr))execprimitive(addr)    // a primitive
           else{rstack.push(ip); call(addr);}    
       }while(!abortexec);
   }
   function ret(){                                     // high level return
       if(rstack.length===0){abortexec=true; return;}
       ip=rstack.pop();}
   function exec(cmd){ntib=0; error=false; tib=cmd;    // outer loop
       do{    token=nexttoken(); if(token==="")break;
           var n=parseInt(token,base);                       // convert to number, javascript allow parseInt(str,base)
           var nword=findword(token);
           if(nword>-1){var w=words[nword];
               if(compiling && !w.immediate)compilecode(nword)
               else execute(w.xt);                              
           }else if(n || token==0){                                     // if the token is a number
               if(compiling){    
                   compilecode("doLit"); dictcompile(n);    // compile an literal
               }else stack.push(n);  
           }else panic(" ? "+token);
       }while(!error);}
   function tick(){token=nexttoken(); var i=findword(token); if(i>=0)stack.push(i);
          else panic(" ? "+token);}
////////////////////////
  function toname(cfa) {
         for (var i=0;i<words.length;i++) {
                if (words[i].xt===cfa) {
                  return words[i].name;
                }
         }
         return "";
  }
  function see() {
         var token=nexttoken();
         var wid=findword(token);
         if (wid>-1) {
                var xt=words[wid].xt;
                if(typeof(xt)==="function") {
                       systemtype(token+" is a primitive");
                       return;
                }
                cr(); var c=findword("doCon"); var v=findword("doVar"); var x=xt; var lst=[x];
                do {var cfa=dictionary[x]; var a=cfa&dictsize;
                      if (isprimitive(cfa)) { var n=words[a].name;
                            if(n==="doLit"||a===c||a===v)++x;
                            else if(n==="0branch"||n==="branch"||n==="doNext")lst.push(++x);
                      }
                   x++;
                } while ( words[a].xt!==ret && a!==c && a!==v );
                do { if(xt in lst){cr(); greentype(xt+": ");}
                      var cfa=dictionary[xt]; var a=cfa&dictsize;
                      if (isprimitive(cfa)) { var n=words[a].name;
                            systemtype(n+" ");
                            if(n==="doLit"||a===c||a===v)systemtype(dictionary[++xt] & dictsize);
                            else if(n==="0branch"||n==="branch"||n==="doNext")greentype(dictionary[++xt] & dictsize);
                      } else {
                            var name=toname(cfa);
                            if (name==="")
                                  systemtype(cfa.toString(base));
                            else systemtype(name);
                      }
                   xt++;
                } while ( words[a].xt!==ret && a!==c && a!==v );
   }  }
   
   var tests=" ";
   
   //params of javascript function
   var js_nparam = {lineTo:2 , moveTo:2, fillRect:4 , lineWidth:1};
   
   var words = [
   {name:"here"    ,xt:function(){ // here        ( -- a ) 系統 dictionary 編碼位址 a
      stack.push(here);}}
  ,{name:","       ,xt:function(){ // ,        ( n -- ) 將 n 編碼到系統 dictionary
         dictcompile(stack.pop());}}
  ,{name:"doLit"   ,xt:function(){ // doLit    ( -- n ) 將系統 dictionary 中當前 doLit 指令隨後數值 n 取出
         stack.push(dictionary[ip++]);}}
  ,{name:"exit"    ,xt:ret}        // exit        ( -- ) 跳出高階指令的程式碼
  ,{name:"doCol"    ,xt:function(){} }        // exit        ( -- ) 跳出高階指令的程式碼
  ,{name:":"       ,xt:function(){ // :        ( <name> -- ) 定義高階指令
      newname=nexttoken();newxt=here; compilecode("doCol"); compiling=true;}}
  ,{name:";"       ,xt:function(){ // ;        ( -- ) 結束高階指令定義
      compiling=false;
      compilecode("exit");
      words.push({name:newname,xt:newxt});
    },immediate:true}
  ,{name:"*"       ,xt:function(){ // *        ( a b -- c ) 計算 a 與 b 兩數相乘的積 c
      stack.push(stack.pop()*stack.pop());}}
  ,{name:"dup"     ,xt:function(){ // dup        ( n -- n n ) 複製堆疊頂的數值 n
      stack.push(stack[stack.length-1]);}}
  ,{name:"drop"    ,xt:function(){ // drop        ( n -- ) 丟掉堆疊頂的數值 n
      stack.pop();}}
  ,{name:"."       ,xt:function(){ // .        ( n -- ) 依 base 印出數值 n *** 20111224 sam
         systemtype(stack.pop().toString(base)+" ");}}
  ,{name:"hex"     ,xt:function(){ // hex        ( -- ) 設定數值以十六進制印出 *** 20111224 sam
         base=16;}}
  ,{name:"decimal" ,xt:function(){ // decimal    ( -- ) 設定數值以十進制印出 *** 20111224 sam
         base=10;}}
  ,{name:"base@"   ,xt:function(){ // base@    ( -- n ) 取得 base 值 n *** 20111224 sam
         stack.push(base);}}
  ,{name:"base!"   ,xt:function(){ // base!    ( n -- ) 設定 n 為 base 值 *** 20111224 sam
         base=stack.pop();}}
  ,{name:"cr"      ,xt:cr}            // cr        ( -- ) 到下一列繼續輸出 *** 20111224 sam
  ,{name:"["       ,xt:function(){ // [        ( -- ) 進入直譯狀態, 輸入指令將會直接執行 *** 20111224 sam
      compiling=false;},immediate:true}
  ,{name:"]"       ,xt:function(){ // ]        ( -- ) 進入編譯狀態, 輸入指令將會編碼到系統 dictionary *** 20111224 sam
      compiling=true;}}
  ,{name:"findword",xt:function(){ // findword    ( <name> -- i | -1 ) 取得系統 dictionary 中的指令序號 i *** 20111224 sam
         token=nexttoken(); stack.push(findword(token));}}
  ,{name:"'"       ,xt:tick}        // '        ( <name> -- i ) 取得系統 dictionary 中的指令序號 i *** 20111224 sam
  ,{name:"(')"     ,xt:function(){ // '        ( -- i ) 取隨後位址內的指令序號 i *** 20111224 sam
         stack.push(dictionary[ip++])}}
  ,{name:"[']"     ,xt:function(){ // '        ( <name> -- i ) 取得系統 dictionary 中的指令序號 *** 20111224 sam
         compilecode("(')"); tick(); compilecode(stack.pop())},immediate:true}
  ,{name:"words"   ,xt:function(){ // words    ( -- ) 印出系統 dictionary 中已定義的所有指令名稱 *** 20111224 sam
         for(var i in words)systemtype(words[i].name+" ");}}
  ,{name:"branch"    ,xt:function(){ // branch    ( -- ) 將當前 ip 內數值當作 ip *** 20111224 sam
         ip=dictionary[ip]&dictsize;}}
  ,{name:"0branch"    ,xt:function(){ // 0branch    ( n -- ) 若 n!==0 就將當前 ip 內數值當作 ip, 否則將 ip 進位 *** 20111224 sam
         if(stack.pop())ip++; else ip=dictionary[ip]&dictsize;}}
  ,{name:"if"      ,xt:function(){ // if        ( -- here ) 將 "0branch" 編碼到系統並留下 here 待 else 或 then 填入位址 *** 20111224 sam
      compilecode("0branch"); stack.push(here); dictcompile(0);},immediate:true}
  ,{name:"else"    ,xt:function(){ // else        ( there -- here ) 將 "branch" 編碼到系統且留下 here 並將 here 填入 if 原留位址 *** 20111224 sam
      compilecode("branch"); var h=here; dictcompile(0); dictionary[stack.pop()]=here; stack.push(h);},immediate:true}
  ,{name:"then"    ,xt:function(){ // then        ( there -- ) 將 here 填入 if 或 else 原留位址 *** 20111224 sam
      dictionary[stack.pop()]=here;},immediate:true}
  ,{name:"begin"    ,xt:function(){ // begin    ( -- here ) 留下 here 待 agan , until, or repeat 填入位址 *** 20111224 sam
      stack.push(here);},immediate:true}
  ,{name:"again"    ,xt:function(){ // again    ( there -- ) 將 "branch" 編碼到系統並編入 begin 原留位址 *** 20111224 sam
      compilecode("branch"); compilecode(stack.pop());},immediate:true}
  ,{name:"until"    ,xt:function(){ // until    ( there -- ) 將 "0branch" 編碼到系統且編入 begin 原留位址 *** 20111224 sam
      compilecode("0branch"); compilecode(stack.pop());},immediate:true}
  ,{name:"while"    ,xt:function(){ // while    ( there -- there here ) 將 "0branch" 編碼到系統且留下 here 待 repeat 填入位址 *** 20111224 sam
      compilecode("0branch"); stack.push(here); dictcompile(0);},immediate:true}
  ,{name:"repeat"   ,xt:function(){ // repeat    ( there1 there2 -- ) 將 "branch" 編碼到系統且編入 begin 原留位址, 並將 here 填入 while 原留位址 *** 20111224 sam
      compilecode("branch"); var w=stack.pop(); compilecode(stack.pop()); dictionary[w]=here;},immediate:true}
  ,{name:".s"       ,xt:function(){ // ,s        ( -- ) 印出 stack 上所有數字 *** 20111224 sam
         if(stack.length>0)for(var i in stack)systemtype(stack[i]+" ")
         else systemtype("empty");}}
  ,{name:"+"        ,xt:function(){ // +        ( a b -- c ) 計算 a 與 b 兩數相加的和 c
      stack.push(stack.pop()+stack.pop());}}
  ,{name:"1+"       ,xt:function(){ // 1+        ( a b -- c ) 計算 a 與 b 兩數相加的和 c
      stack.push(stack.pop()+1);}}
  ,{name:"2+"       ,xt:function(){ // 2+        ( a b -- c ) 計算 a 與 b 兩數相加的和 c
      stack.push(stack.pop()+2);}}
  ,{name:"-"        ,xt:function(){ // -        ( a b -- c ) 計算 a 與 b 兩數相減的差 c
      var b=stack.pop(); stack.push(stack.pop()-b);}}
  ,{name:"1-"       ,xt:function(){ // 1-        ( a b -- c ) 計算 a 與 b 兩數相加的和 c
      stack.push(stack.pop()-1);}}
  ,{name:"2-"       ,xt:function(){ // 2-        ( a b -- c ) 計算 a 與 b 兩數相加的和 c
      stack.push(stack.pop()-2);}}
  ,{name:"/"        ,xt:function(){ // /        ( a b -- c ) 計算 a 與 b 兩數相除的商 c
      var b=stack.pop(); stack.push(stack.pop()/b);}}
  ,{name:"mod"      ,xt:function(){ // mod        ( a b -- c ) 計算 a 與 b 兩數相除的餘 c
      var b=stack.pop(); stack.push(stack.pop()%b);}}
  ,{name:"div"      ,xt:function(){ // div        ( a b -- c ) 計算 a 與 b 兩數相除的整數商 c
      var b=stack.pop(); var a=stack.pop(); stack.push((a-(a%b))/b);}}
  ,{name:"see"      ,xt:see}         // see        ( <name> -- ) 解譯所給指令 *** 20111227 yap
  ,{name:"0="       ,xt:function(){ // 0=        ( a -- f ) 比較 a 是否等於 0
      stack.push(stack.pop()===0);}}
  ,{name:"0<"       ,xt:function(){ // 0<        ( a -- f ) 比較 a 是否小於 0
      stack.push(stack.pop()<0);}}
  ,{name:"0>"       ,xt:function(){ // 0>        ( a -- f ) 比較 a 是否大於 0
      stack.push(stack.pop()>0);}}
  ,{name:"0<>"      ,xt:function(){ // 0<>        ( a -- f ) 比較 a 是否不等於 0
      stack.push(stack.pop()!==0);}}
  ,{name:"0<="      ,xt:function(){ // 0<=        ( a -- f ) 比較 a 是否小於等於 0
      stack.push(stack.pop()<=0);}}
  ,{name:"0>="      ,xt:function(){ // 0>=        ( a -- f ) 比較 a 是否大於等於 0
      stack.push(stack.pop()>=0);}}
  ,{name:"="        ,xt:function(){ // =        ( a b -- f ) 比較 a 是否等於 b
      stack.push(stack.pop()===stack.pop());}}
  ,{name:">"        ,xt:function(){ // >        ( a b -- f ) 比較 a 是否大於 b
      var b=stack.pop(); stack.push(stack.pop()>b);}}
  ,{name:"<"        ,xt:function(){ // >        ( a b -- f ) 比較 a 是否小於 b
      var b=stack.pop(); stack.push(stack.pop()<b);}}
  ,{name:"<>"       ,xt:function(){ // <>        ( a b -- f ) 比較 a 是否不等於 b
      stack.push(stack.pop()!==stack.pop());}}
  ,{name:">="       ,xt:function(){ // >        ( a b -- f ) 比較 a 是否大於等於 b
      var b=stack.pop(); stack.push(stack.pop()>=b);}}
  ,{name:"<="       ,xt:function(){ // >        ( a b -- f ) 比較 a 是否小於等於 b
      var b=stack.pop(); stack.push(stack.pop()<=b);}}
  ,{name:"=="       ,xt:function(){ // ==        ( a b -- f ) 做必要轉換後, 比較 a 與 b 兩數是否相等
      stack.push(stack.pop()==stack.pop());}}
  ,{name:"doCon"    ,xt:function(){ // doCon    ( -- n ) 取隨後位址內數值 n
      stack.push(dictionary[ip]); ret();}}
  ,{name:"constant" ,xt:function(){ // constant ( <name> -- ) 定義常數名稱
     newname=nexttoken(); words.push({name:newname,xt:here}); compilecode("doCon"); dictcompile(stack.pop());}}
  ,{name:"doVar"    ,xt:function(){ // doVar    ( -- a ) 取隨後位址 a
      stack.push(ip); ret();}}
  ,{name:"variable" ,xt:function(){ // variable ( <name> -- ) 定義變數名稱
         newname=nexttoken(); words.push({name:newname,xt:here}); compilecode("doVar"); dictionary[here++]=0;}}
  ,{name:"create"   ,xt:function(){ // create ( <name> -- ) 定義 memory 區塊名稱
         newname=nexttoken(); words.push({name:newname,xt:here}); compilecode("doVar");}}
  ,{name:"allot"    ,xt:function(){ // allot ( n -- ) 增加 n cells 擴充 memory 區塊
         var h=here; here+=stack.pop(); for(var i=h;i<here;i++)dictionary[i]=0;}}
  ,{name:"@"        ,xt:function(){ // @ ( a -- n ) 從位址 a 取出 n
         stack.push(dictionary[stack.pop()]);}}
  ,{name:"?"        ,xt:function(){ // ? ( a -- ) 印出位址 a 內的值
         systemtype(dictionary[stack.pop()]);}}
  ,{name:"!"        ,xt:function(){ // ! ( n a -- ) 將 n 存入位址 a
         dictionary[stack.pop()]=stack.pop();}}
  ,{name:"swap"     ,xt:function(){ // swap    ( a b -- b a )
      var t=stack.length-1; var b=stack[t]; stack[t]=stack[t-1]; stack[t-1]=b;}}
  ,{name:"nip"         ,xt:function(){ // nip        ( a b -- b )
      stack[stack.length-2]=stack.pop();}}
  ,{name:"rot"         ,xt:function(){ // rot        ( a b c -- b c a )
      var t=stack.length-1; var a=stack[t-2]; stack[t-2]=stack[t-1]; stack[t-1]=stack[t]; stack[t]=a;}}
  ,{name:"pick"     ,xt:function(){ // pick    ( nj ... n1 n0 j -- nj ... n1 n0 nj )
      var t=stack.length-1; var j=stack[t]; stack[t]=stack[t-j-1];}}
  ,{name:"roll"     ,xt:function(){ // roll    ( nj ... n1 n0 j -- ... n1 n0 nj )
      var j=stack.pop();
      if(j>0){
      var t=stack.length-1;
      var nj=stack[t-j];
      for(i=j-1;i>=0;i--)
        stack[t-i-1]=stack[t-i];
      stack[t]=nj;}}}
  ,{name:"doNext"     ,xt:function(){ // doNext    ( nj ... n1 n0 j -- ... n1 n0 nj )
      var i=rstack.pop()-1; if(i>0){ip=dictionary[ip]; rstack.push(i); }
      else ip++;}}
  ,{name:">r"         ,xt:function(){ // >r    ( n -- )
      rstack.push(stack.pop());}}
  ,{name:"r>"         ,xt:function(){ // r>    ( -- n )
      stack.push(rstack.pop());}}
  ,{name:"r@"         ,xt:function(){ // r>    ( -- i )
      stack.push(rstack[rstack.length-1]);}}
  ,{name:"for"         ,xt:function(){ // for
      compilecode(">r"); stack.push(here);},immediate:true}
  ,{name:"next"     ,xt:function(){ // next
      compilecode("doNext"); dictionary[here++]=stack.pop();},immediate:true}

  ,{name:"does>"     ,xt:function(){ 
      dictionary[words[words.length-1].xt] =ip;
      compilecode("exit");
      }}
      
  ,{name:"doStr"     ,xt:function(){ // next
      stack.push(dictionary[ip++]);
      }}

  ,{name:'s"'     ,xt:function(){ // next
      var s=nexttoken('"');
     //console.log('['+s+']');
      if (compiling) {
        compilecode("doStr");
        dictcompile(s);
      } else {
      	stack.push(s);
      }
    }
    ,immediate:true}
  ,{name:".r"         ,xt:function(){ // .r    ( i n -- )
      var n=stack.pop(); var i=stack.pop();
      i=i.toString(base);
      n=n-i.length;
      if(n>0)do{
         i="0"+i;
         n--;}while(n>0);
      systemtype(i); }}
  ,{name:"space"         ,xt:function(){
      systemtype(" ");}}
   ,{name:"canvas:" , xt :function() { //create a context object
   	   var canvasid=nexttoken();
   	   var canvas=document.getElementById(canvasid);
   	   var c=canvas.getContext('2d');
   	   words.push({name:canvasid,xt:here}); 
   	   compilecode("doCon");
   	   dictcompile(c);
   	   compilecode("exit");
     }}
     // cv :: lineTo
   ,{name:"::" , xt: function() {  // make a javascript call
   	   var funcname=nexttoken();
   	   var obj=stack.pop();
   	   var fn=obj[funcname];
   	   if (fn) {
   	   	   var pcount=fn.length;
   	   	   if (fn.length===0) pcount=js_nparam[fn.name]; //try to fetch from array
   	   	   if (pcount==undefined) pcount=0;
   	   	   var params=[];
   	   	   for (var i=0; i<pcount;i++) params[pcount-i-1]=stack.pop();
   	   	   fn.apply(obj, params);
   	   } else {
   	   	   panic("? "+funcname);
   	   }
    }}
  ,{name:":!" , xt: function() {  // make a javascript call
   	   var propname=nexttoken();
   	   var obj=stack.pop();
   	   //var prop=obj.__proto__[propname];
   	   obj[propname]=stack.pop() ;
},immediate:true}
  ,{name:":@" , xt: function() {  // make a javascript call
   	   var propname=nexttoken();
   	   var obj=stack.pop();
   	   //var prop=obj.__proto__[propname];
   	   stack.push( obj[propname] ) ;
    }}    
   ]
   this.exec= exec;  // make exec become a public interface
 }
 window.KsanaVm=KsanaVm;  // export KsanaVm as a global variable
})();