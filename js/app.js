;(function(window, document, $, undefined) {

var app, $window = $(window);

uaIs = (function(){
  ua = window.navigator.userAgent.toLowerCase();
  return function(str){
    re = new RegExp(str, "i");
    return ua.match(re);
  }
})();

var ScrollManager = function(){
  this.initialize();
}

ScrollManager.prototype = {
  prev: 0,

  initialize: function(){
    this.$win = $(window);
    
    if(uaIs("iphone|andorid")) this.hideTopbar();
    this.scrollInit();
    this.hideTopbar();
  },

  hideTopbar: function(){
    window.addEventListener("load", function(){
      setTimeout(scrollBy, 100, 0, 1);
    }, false);
  },

  scrollInit: function(){
    var self = this;

    $('#content_scroller').height( ScrollManager.contentHeight );

    this.iscroll = new iScroll('content_scroller', {
      useTransition: false,/* useTransitionがtrueだとmomentumの間にonAnimationMoveがコールされなくなる */
      //momentum: false,
      // onScrollStart: function(e) {
      //  e.preventDefault();
      //  console.log('onScrollStart');
      // },
      // onBeforeScrollMove: function(e) {
      //  console.log('onBeforeScrollMove');
      // },
      onScrollMove: function(e) {
        self.onScrollMove(this.y);        
      },
      // onBeforeScrollEnd: function(e) {
      //  console.log('onBeforeScrollEnd');
      // },
      // onScrollEnd: function(e) {
      // console.log('onScrollEnd');
      // },
      /** iscroll custom **/
      onAnimationMove: function(x, y) {
        self.onScrollMove(y);
        self.onScrollEnd(this.y, this.maxScrollY);
      }
    });
  },

  onScrollMove: function(y){
    this.$win.trigger("scrollmove", {y: y, v: y-this.prev});
    this.scrollY = y;
    this.prev = y;
  },

  onScrollEnd: function(){}
}

ScrollManager.contentHeight = (function(){
  var h = 444;

  if(uaIs("iphone|andorid")) {
    h = $window.height();
    h = h > 444 ? 504 : 504;
  }

  return h;
})();

var CanvasManager = function(){
  this.initialize();
}

CanvasManager.prototype = {
  scrollObj: null,
  currentStage: null,

  initialize: function(){
    // それぞれCanvasを初期化
    this.$el = $(".bnr-canvas");
    this.list = this.refresh();


    $window.bind("scrollmove", $.proxy(this.getCurrentStage, this));
    $window.trigger("scrollmove", {y:0, v:0});
  },
  refresh: function(scrollTop){
    var scrollTop = scrollTop || 0,
        dict = this.dict = {};

    return this.$el.each(function(i, j){
      var $this = $(this);

      this.topY = $this.offset().top - scrollTop;
      this.bottomY = this.topY + $this.height();


      if(! this.stage){
        this.stage = new createjs.Stage( $this.attr("id") );
        this.stage.cname = "c"+i;
        this.stage.el = this;
      }
      console.log(this.stage.cname, this.topY);
      dict[this.stage.cname] = this.stage;
      return this.stage;
    });
  },
  getCurrentStage: function(e, o){
    var scn = {top: -o.y, bottom: ScrollManager.contentHeight-o.y},
        stages = this.currentStage = [];

    //jQueryオブジェクトが帰ってきてしまうので、配列に入れる
    this.$el.filter(":visible").map(function(){
      if(this.bottomY > scn.top && this.topY < scn.bottom) {
        stages.push(this.stage);
      }
    });

    this.scrollObj = o;
  },
  renderStart: function(){
    var self = this;
    this._cb = $.proxy(this.tick, this);
    createjs.Ticker.addEventListener("tick", this._cb);
  },
  renderStop: function(){
    createjs.Ticker.removeEventListener("tick", this._cb);
    this._cb = null;
  },
  tick: function(){
    if(this.currentStage) {
      $.each(this.currentStage, function(j, i){ i.update(); });
      app.puppet.animate(this.currentStage, this.scrollObj);
    }
  }
}


var Puppet = function(){
  this.initialize();
}

Puppet.prototype = {
  prevY: 0,
  prevStage: null,
  onswitchedY: 0, //stageが切り替わったときのY

  digcounter: function(times, cb){
    var count=0, d = $.Deferred();
    d.done(cb);
    return function(){
      if(count++ > times) return d.resolve();
    }
  },

  initialize: function(){
    this.puppet = this.puppetInit();
    this.counter = this.digcounter(10, this.onUnderground);
  },

  puppetInit: function(){

    spriteSheet = new createjs.SpriteSheet({
      images: ["img/frames.png"],
      frames: {
        "regX": 60,
        "regY": 60,
        "width":120,
        "height": 240
      },
      animations: {
        "walk": [0, 3],
        "fall" : [4, 7],
        "falling" : [8],
        "falling2" : [8, 9],
        "fall2" : [10, 11],
        "swim" : [13, 15],
        "dig" : [16, 17],
        "out" : [18, 28],
        "samba" : [29, 30]
      }
    });

    this.sprite = new createjs.BitmapAnimation(spriteSheet);

    this.sprite.gotoAndStop("walk");
    this.sprite.x = 620;
    this.sprite.y = 60;

    this.spriteSheet = spriteSheet;

/*
----------------------------------------ソン ↓
*/
    waterSpriteSheet = new createjs.SpriteSheet({
      images: ["img/water.png"],
      frames: {
        "regX": 192,
        "regY": 182,
        "width":384,
        "height": 182
      },
      animations: {
        "water": [0, 5], "holl" : []
      }
    });

    this.water = new createjs.BitmapAnimation(waterSpriteSheet);

    this.water.gotoAndStop("water");
    this.water.x = 0;
    this.water.y = 0;

    this.waterSpriteSheet = waterSpriteSheet;

    hollSpriteSheet = new createjs.SpriteSheet({
      images: ["img/hole01.png"],
      frames: {
        "regX": 30,
        "regY": 0,
        "width":60,
        "height": 60
      },
      animations: {
        "holl": [0, 1]
      }
    });

    this.holl = new createjs.BitmapAnimation(hollSpriteSheet);

    this.holl.gotoAndStop(0);
    this.holl.x = 0;
    this.holl.y = 0;

    this.hollSpriteSheet = hollSpriteSheet;
/*
----------------------------------------ソン ↑
*/

  },

  onUnderground: function(){
    $(".underground").show();
    app.scrollManager.iscroll.refresh();
    app.canvasManager.refresh(app.scrollManager.scrollY);
  },

  animate: function(stage, obj){
    var
      method, divY=0,
      dict = app.canvasManager.dict,
      stages = stage.concat(),
      y = -obj.y;

    if(!stages) return;

    switch(true) {
      case y < 41   : method = "walk";
        stage = dict["c0"];
        break;
      case y < 120  : method = "fall";
        stage = dict["c0"];
        break;
      case y < 600  : method = "falling";
        stage = dict["c1"];
        break;
      case y < 1200 : method = "falling2";
        stage = dict["c2"];
        break;
      case y < 1500 : method = "falling3";
        stage = dict["c3"];
        break;
      case y < 1855 : method = "swim";
        stage = dict["c4"];
        break;
      case y < 2120 : method = "swim2";
        stage = dict["c5"];
        break;
      case y < 2300 : method = "swim3";
        stage = dict["c5"];
        break;
      case y < 2500 : method = "dig";
        stage = dict["c6"];
        divY = 2300;
        break;
      case y < 2750 : method = "dig";
        stage = dict["c7"];
        divY = 2500;
        break;
      case y < 3395 : method = "dig";
        stage = dict["c8"];
        divY = 2750;
        break;
      case y < 3665 : method = "dig";
        stage = dict["c9"];
        divY = 3395;
        break;
      case y < 6000 : method = "out";
        stage = dict["c10"];
        break;
      default       : method = "walk";     break;
    }

    if(stage && this.prevStage != stage){
      stage.addChild(this.sprite);

      if (method === "falling3") {
        stage.addChild(this.water);
      } else if (method === "dig") {
        if(! stage.drawHole ) stage.drawHole = this.drawHole(stage, divY);
        if(this.holl.currentFrame == 0) stage.addChild(this.holl);
      } else if (method === "out") {
        this.prevStage.drawHole(this.holl, this.sprite, true);
      }

      if(! this.drawSambaFunc) {
        this.drawSambaFunc = this.drawSamba();
        this.drawSambaFunc(29);
      }

      if(method === "swim" || method === "swim2" ){
        if( !stage.drawBubbleFunc ){
          stage.drawBubbleFunc = this.drawBubble(stage);
        }
      }


    }
    //console.log(y, method, dict);

    this[method](y, stage, divY, y-this.prevY > 0);
    this.prevStage = stage;
    this.prevY = y;
  },

  walk: function(y){
    var step = y/5 | 0;
    step = step < 0 ? 0 : step;
    
    this.sprite.x = 620 - 18 * step;
    this.sprite.y = 60;
    this.sprite.gotoAndStop( step%4 );
  },

  fall: function(y){
    var step = (y-50)/4 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =450; 
    this.sprite.y = 60 + step *5;
    this.sprite.gotoAndStop( 4+(step > 3 ? 3 : step )%4 );
  },
  falling: function(y){
    var step = (y-130)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    this.sprite.y = -60 + step *2;
    this.sprite.gotoAndStop(8);
  },
  falling2: function(y){
    var step = (y-600)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    this.sprite.y = -60 + step *2;
    this.sprite.gotoAndStop(8 + ( step /10 | 0 )%2);
  },
  falling3: function(y){
    var step = (y-1200)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    this.sprite.y = -60 + step *4;
    this.sprite.gotoAndStop(8 + ( step /15 | 0 )%2);

/*
----------------------------------------ソン ↓
*/


    if (this.sprite.y > 30) {
      this.sprite.gotoAndStop(10 + ( step /20 | 0 )%2);
      if(this.sprite.y > 158){
        this.water.x = this.sprite.x; 
        this.water.y = 245;
        this.water.gotoAndStop(( step /8 | 0 )%6);
      }
    } else{
      this.water.gotoAndStop(-1);
    }
    
/*
----------------------------------------ソン ↑
*/
  },
  swim:function(y, stage){
    var step = (y-1500)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    this.sprite.y = -60 + step *4;
    this.sprite.gotoAndStop(13 + ( step /10 | 0 )%3);
    stage.drawBubbleFunc(this.sprite, y, stage);
  },
  swim2: function(y, stage){
    var y, step = (y-1855)/2 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    y = -60 + step *2.9;
    this.sprite.y = y > 267 ? 267 : y;
    this.sprite.gotoAndStop(13 + ( step /10 | 0 )%3);
    stage.drawBubbleFunc(this.sprite, y, stage);
  },
  swim3: function(y){
    var step = (y-2063+60)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =460; 
    this.sprite.y = 267;

    if(y > 2240) this.sprite.y = 4*step;
    this.sprite.gotoAndStop(10 + ( step /10 | 0 )%2);

    this.counter();
  },
  dig: function(y, stage, divY, downward){
    var step = (y-divY)
    this.sprite.x = 30;
    this.sprite.y = (-60 + 2*step);
    this.sprite.gotoAndStop(16+ ( step /20 | 0 )%2);

    if(downward) stage.drawHole(this.holl, this.sprite);
    this.holl.x = this.sprite.x;

  },
  out: function(y, stage){
    var step = (y-3645),
        frame = 18+ ( step /10 | 0 );
    if(y < 3700) {
      this.sprite.x = 460-(step);
      this.sprite.y = 40+260 * Math.sin(step/18.5);
    } else {
      this.sprite.x = 380;
      this.sprite.y = 100;
    }

    this.sprite.gotoAndStop(frame > 27 ? 27 : frame);

    if( y > 3750 ) {
      this.sprite.gotoAndStop(28);
      this.drawSambaFunc(30);
    } else {
      this.drawSambaFunc(29);
    }

    var opacity = ( step / 100);
    if(app.kakao.css("opacity") <= 1) app.kakao.css({ 'opacity' : opacity <=1 ? opacity:1 });

  },

  drawBubble: function (stage){

    var bB_01 = new createjs.Bitmap('img/bubble_b.png');
    var sB_01 = new createjs.Bitmap('img/bubble_s.png');

    var bB_02 = new createjs.Bitmap('img/bubble_b.png');
    var sB_02 = new createjs.Bitmap('img/bubble_s.png');
    
    stage.addChild(bB_01);
    stage.addChild(sB_01);
    stage.addChild(bB_02);
    stage.addChild(sB_02);  

    return function (sprite, y, stage) {

      if ( sprite.y > 100 ){
        bB_01.alpha = 1;
        sB_01.alpha = 1;
        bB_01.x = sprite.x - 50;
        sB_01.x = sprite.x - 40;
        bB_01.y = -(sprite.y / 1.1) + 130;
        sB_01.y = -(sprite.y / 1.2) + 150;
      } else {
        bB_01.alpha = 0;
        sB_01.alpha = 0;
      }

      if ( sprite.y > 150 ){
        bB_02.alpha = 1;
        sB_02.alpha = 1;
        bB_02.x = sprite.x + 40;
        sB_02.x = sprite.x + 35;
        bB_02.y = -(sprite.y / 1.1) + 230;
        sB_02.y = -(sprite.y / 1.2) + 250;
      } else {
        bB_02.alpha = 0;
        sB_02.alpha = 0;
      }
    }
  },

  drawSamba: function (){
    var stage = app.canvasManager.dict["c10"];
    var samba = this.sprite.clone();
    stage.addChild(samba);
    samba.x = 300;
    samba.y = 100;

    return function (num){
      samba.gotoAndStop(num);
    }
    
  },

  drawHole: function(stage, y){
    var g = new createjs.Graphics();
    var s = new createjs.Shape(g);

    stage.addChildAt(s, 0);
    
    return function(holl, sprite, endFlg){
      var h = sprite.y + 50;

      if(h < s.h) return;

      if(y < 3390 || sprite.y < 600){
        holl.y = h;
        g.clear();
        g.beginBitmapFill(img);
        g.drawRect (0,0, 60, h);
        s.h = h;
      }
      if(endFlg){
        if (y > 3390 ){
          holl.gotoAndStop(1);
          holl.y = 510;
        }
        g.beginBitmapFill(img);
        g.drawRect (0,0, 60, 530);
      }
    }
  }
}

var App = function(){
  this.initialize();

}
App.prototype = {
  initialize: function(){
    var 
      canvasManager = new CanvasManager(),
      scrollManager = new ScrollManager(),
      puppet = new Puppet();

    canvasManager.renderStart();

    this.scrollManager = scrollManager;
    this.canvasManager = canvasManager;
    this.puppet = puppet;

    this.kakao = $('.kakao');
  }

}

var img = new Image();
img.src="img/hole.png";

app = new App();

})(window, document, jQuery);
