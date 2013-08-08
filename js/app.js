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
			// 	e.preventDefault();
			// 	console.log('onScrollStart');
			// },
			// onBeforeScrollMove: function(e) {
			// 	console.log('onBeforeScrollMove');
			// },
			onScrollMove: function(e) {
				self.onScrollMove(this.y);				
			},
			// onBeforeScrollEnd: function(e) {
			// 	console.log('onBeforeScrollEnd');
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
    this.counter = this.digcounter(15, this.onUnderground);
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
  },

  onUnderground: function(){
    $(".underground").show();
    app.scrollManager.iscroll.refresh();
    app.canvasManager.refresh(app.scrollManager.scrollY);
  },

  animate: function(stage, obj){
    var
      method,
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
      case y < 4500 : method = "dig";
        var sy = (y-4500)/300 | 0;
        stage = dict["c"+(6+sy)];
        break;
      default       : method = "walk";     break;
    }


    if(stage && this.prevStage != stage){
      stage.addChild(this.sprite);
      this.onswitchedY = y;
    }
//console.log(y, method, dict);
    
    this[method](y);
    this.prevStage = stage;
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

    this.sprite.x =430; 
    this.sprite.y = -60 + step *2;
    this.sprite.gotoAndStop(8);
  },
  falling2: function(y){
    var step = (y-600)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    this.sprite.y = -60 + step *2;
    this.sprite.gotoAndStop(8 + ( step /15 | 0 )%2);
  },
  falling3: function(y){
    var step = (y-1200)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    this.sprite.y = -60 + step *4;
    this.sprite.gotoAndStop(8 + ( step /15 | 0 )%2);
  },
  swim:function(y){
    var step = (y-1500)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    this.sprite.y = -60 + step *4;
    this.sprite.gotoAndStop(13 + ( step /10 | 0 )%3);
  },
  swim2: function(y){
    var y, step = (y-1855)/2 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    y = -60 + step *2.9;
    this.sprite.y = y > 267 ? 267 : y;
    this.sprite.gotoAndStop(13 + ( step /10 | 0 )%3);
  },
  swim3: function(y){
    var step = (y-2063+60)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    this.sprite.y = 267;

    if(y > 2240) this.sprite.y = 4*step;
    this.sprite.gotoAndStop(10 + ( step /10 | 0 )%2);

    this.counter();
  },
  dig: function(y){
    var step = (y-2300)/3 | 0;
    step = step < 0 ? 0 : step;

    this.sprite.x =430; 
    this.sprite.y = -60 + 6*step;
    this.sprite.gotoAndStop(16+ ( step /8 | 0 )%2);

//    this.counter();
  },
  out: function(y){
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
  }

}

app = new App();

})(window, document, jQuery);
