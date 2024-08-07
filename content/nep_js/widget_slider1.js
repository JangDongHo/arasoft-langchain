//<![CDATA[
function detectLeftButton(evt){evt = evt || window.event;var button = evt.which || evt.button;return button == 1;}
function gv(e, v){return e.attr("data-nw-"+v);}
function findHighestZIndex(selector){
	if (!selector) { selector = "*" };
    var elements = document.querySelectorAll(selector) ||
                   oXmlDom.documentElement.selectNodes(selector),
        i = 0,
        e, s,
        max = elements.length,
        found = [];

    for (; i < max; i += 1) {
        e = elements[i].style.zIndex;
        s = elements[i].style.position;
        if (e && s !== "static") {
          found.push(parseInt(e, 10));
        }
    }

    return found.length ? Math.max.apply(null, found) : 0;
}
var nw_slider1 = {
	cName: "nw_slider1",
	exe : function(){
		var _this = this;
		var node = window.getSelection().anchorNode;
		if(!$(node).hasClass(_this.cName))node = "";
		if(node){
			_this.widget("init", $(node));
		}else{
			$("."+_this.cName).each(function(){
				_this.widget("exe", $(this));
			});
		}
	},
	widget : function(action, t){
		if(!$(t).hasClass(this.cName))return;

		var cf = {
			direction:gv(t, "direction"),
			navigation:gv(t, "navigation"),
			roll:gv(t, "roll"),
			flexible:gv(t, "flexible"),
			fullview:gv(t, "fullview"),
			_w:(parseFloat($("body").width())+(parseFloat($("body").css("padding"))*2)),
			_h:(parseFloat($("body").height())+(parseFloat($("body").css("padding"))*2)),
			_total:t.find("li").length,
			_cursor:{_start:0, _end:0, _left:0, _top:0, _move:0, _finish:0, _last:0},
			_current:0,
			_current_prev:0,
			_current_next:0,
			_pos:[],
			_tmp:0,
			_mouse_up:{x:0, t:0},
			_mouse_down:{x:0, t:0}
		};

		switch(cf.direction){
			case "horizental":
				var _op = t.width();
				var $op = "left";
				break;
			case "vertical":
				var _op = t.height();
				var $op = "top";
				break;
		}

		var e = {
			init : function(){
				/* Value Reset */
				cf.direction = gv(t, "direction");
				cf.navigation = gv(t, "navigation");
				cf.roll = gv(t, "roll");
				cf.flexible = gv(t, "flexible");
				cf.fullview = gv(t, "fullview");

				t.find(".nw_list").css({
					"width":t.width(),
					"height":t.height()
				});
				
				/* Init */
				t.find("li").each(function(i){
					cf._pos[i] = i * _op;
					if(cf.direction == "horizental"){
						$(this).css({"top":"0px", "left":cf._pos[i]});
					}else if(cf.direction == "vertical"){
						$(this).css({"top":cf._pos[i],"left":"0px"});
					}

					$(this).css({
						"width":t.width(),
						"height":t.height()
					});

					/*if(cf.flexible == "true"){
						$(this).find("img").css({"width":"100%","height":"100%"});
						$(this).css({
							"background-size":"100% 99.99%",
							"background-image":"url('"+$(this).find("img").attr("src")+"')"
						});
						$(this).find("img").css("opacity","0").addClass("nw_slider1_pointer");
						$(this).find("div").remove();
					}else if(cf.flexible == "false"){
						$(this).find("img").css({"width":"0","height":"0"}).removeClass("nw_slider1_pointer");
						$(this).css({
							"background-size":"contain",
							"background-image":"url('"+$(this).find("img").attr("src")+"')"
						});
						$(this).find("img").css("opacity","0");
					}*/
					if(cf.flexible == "true"){
						$(this).css({"background-image":"url('"+$(this).find("img").attr("src")+"')", "background-size":"100% 99.99%"});
					}else if(cf.flexible == "false"){
						$(this).css({"background-image":"url('"+$(this).find("img").attr("src")+"')", "background-size":"contain"});
					}
					$(this).find("img").css("opacity", "0");
				});
				if(cf.navigation == "true"){
					t.find(".navigation").css("z-index", (parseFloat(findHighestZIndex())+1)).html("");
					t.find("li").each(function(i){
						t.find(".navigation").append("<button>"+(i+1)+"</button>");
					});
					t.find(".navigation button:eq(0)").addClass("active");
				
					if(cf.direction == "vertical"){
						t.find(".navigation").attr("style", "width:auto;top:50%;left:5%;margin-top:-"+((12*cf._total)/2)+"px;z-index:"+(parseFloat(findHighestZIndex())+2));
						t.find(".navigation").find("button").css({
							"display":"block",
							"margin":"7px 0px 7px 0px"
						});
					}else if(cf.direction == "horizental"){
						t.find(".navigation").attr("style", "bottom:10%;left:0px;z-index:"+(parseFloat(findHighestZIndex())+2));
						t.find(".navigation").find("button").css({
							"display":"inline-block",
							"margin":"2px"
						});
					}
				}else if(cf.navigation == "false"){
					t.find(".navigation").html("");
				}

				$(".nw_slider1>.np>.nw_list>li").css("position", "absolute");
				$(".nw_slider1>.np>.navigation").css("position", "absolute");
			},
			exeEvent : function(){
				/* binding unset */
				t.find("li").unbind();

				/* binding set */
				if(t.find("li").length > 1){
					t.find("li")
					.bind("dragstart", e.dragHandler)
					.bind("drag", e.dragHandler)
					.bind("dragend", e.dragHandler);
				}

				/*if(cf.fullview == "true"){
					t.find("li").css("cursor", "pointer");
					if(cf.flexible == "false"){
						t.find("li").each(function(i){
							var obj = $(this);
							$(this).find("div").remove();
							$(this).find("img").load(function(){
								alert("dd");
								var nt = {w:parseFloat($(this).get(0).naturalWidth),h:parseFloat($(this).get(0).naturalHeight)};
								if(nt.w > nt.h){
									console.log("1");
									var fixheight = parseFloat(nt.h) * (parseFloat(t.width())/nt.w);
									$("<div\>",{class:"nw_slider1_pointer"}).css({
										"background-image":"url('"+obj.find("img").attr("src")+"')",
										"top":"50%",
										"left":"0px",
										"margin-top":-(fixheight/2),
										"width":t.width(),
										"height":fixheight
									}).appendTo(obj);
									obj.find("img").clone().appendTo(obj.find(".nw_slider1_pointer"));
								}else if(nt.h > nt.w){
									console.log("2");
									var fixwidth = parseFloat(nt.w) * (parseFloat(t.height())/nt.h);
									$("<div\>",{class:"nw_slider1_pointer"}).css({
										"background-image":"url('"+obj.find("img").attr("src")+"')",
										"top":"0px",
										"left":"50%",
										"margin-left":-(fixwidth/2),
										"width":fixwidth,
										"height":t.height()
									}).appendTo(obj);
									obj.find("img").clone().appendTo(obj.find(".nw_slider1_pointer"));
								}else{
									console.log("3");
									$("<div\>",{class:"nw_slider1_pointer"}).css({
										"background-image":"url('"+obj.find("img").attr("src")+"')",
										"top":"0px",
										"left":"0px",
										"width":t.width(),
										"height":t.height()
									}).appendTo(obj);
									obj.find("img").clone().appendTo(obj.find(".nw_slider1_pointer"));
								}
								e.view_clk();
							});
						});
						e.view_clk();
					}else{
						e.view_clk();
					}
				}else{
					t.find("li").css("cursor", "default");
				}*/
				if(cf.fullview == "true"){
					t.find("ul>li").css("cursor", "pointer");
					t.find("img").mousedown(function(event){
						if(detectLeftButton(event) == false)return;
						cf._mouse_down = {x:event.clientX, time:event.timeStamp}
					});
					t.find("img").mouseup(function(event){
						cf._mouse_up = {x:event.clientX, time:event.timeStamp}
						if(Math.abs(cf._mouse_down.x - cf._mouse_up.x) < 5 && Math.abs(cf._mouse_up.time - cf._mouse_down.time) < 200){
							cf._imgs = $(this);
							e.view();
						}
						cf._mouse_up = {x:0, time:0}
						cf._mouse_down = {x:0, time:0}
					});
				}else{
					t.find("ul>li").css("cursor", "default");
				}

				t.mouseleave(function(){t.trigger("mouseup");});
				t.bind("touchstart", e.touchHandler)
					.bind("touchmove", e.touchHandler)
					.bind("touchend", e.touchHandler);
			},
			view_clk : function(){
				t.find(".nw_slider1_pointer").mousedown(function(event){
					if(detectLeftButton(event) == false)return;
					cf._mouse_down = {x:event.clientX, time:event.timeStamp}
				});
				t.find(".nw_slider1_pointer").mouseup(function(event){
					cf._mouse_up = {x:event.clientX, time:event.timeStamp}
					if(Math.abs(cf._mouse_down.x - cf._mouse_up.x) < 5 && Math.abs(cf._mouse_up.time - cf._mouse_down.time) < 200){
						if(cf.flexible == "false")e.view($(this).find("img"));
						else if(cf.flexible == "true")e.view($(this));
					}
					/* mouse clear */
					cf._mouse_up = {x:0, time:0}
					cf._mouse_down = {x:0, time:0}
				});
			},
			touchHandler : function(event){
				var touch = event.originalEvent.changedTouches[0];
				var simulatedEvent = document.createEvent("MouseEvent");
					simulatedEvent.initMouseEvent({
					touchstart: "mousedown",
					touchmove: "mousemove",
					touchend: "mouseup"
				}[event.type], true, true, window, 1,
					touch.screenX, touch.screenY,
					touch.clientX, touch.clientY, false,
					false, false, false, 0, null);
				touch.target.dispatchEvent(simulatedEvent);
				event.preventDefault();
			},
			fixlayer : function(){
				var count = 0;
				for(var i = cf._current; i < t.find(".nw_list>li").length; i++){
					if(cf.direction == "horizental")cf._pos[i] = parseFloat(t.width())*count;
					else if(cf.direction == "vertical")cf._pos[i] = parseFloat(t.height())*count;
					count++;
				}
				count = cf._current;
				for(var i = 0; i < cf._current; i++){
					if(cf.direction == "horizental")cf._pos[i] = -(parseFloat(t.width())*count);
					else if(cf.direction == "vertical")cf._pos[i] = -(parseFloat(t.height())*count);
					count--;
				}

				t.find("li").each(function(i){
					if(cf.direction == "horizental")$(this).css("left", cf._pos[i]);
					else if(cf.direction == "vertical")$(this).css("top", cf._pos[i]);
				});
			},
			dragHandler : function(event){
				t.find("li").stop();
				if(t.find("li").is(":animated"))return;
				var gap = 20;
				if(cf.direction == "horizental")var d = event.clientX;
				else if(cf.direction == "vertical")var d = event.clientY;

				if(event.type == "dragstart"||event.type == "touchstart"){
					cf._cursor._start = d;
					cf._cursor._left = parseFloat(t.find("li").eq(cf._current).css("left"));
					cf._cursor._top = parseFloat(t.find("li").eq(cf._current).css("top"));
				}else if(event.type == "drag"||event.type == "touchmove"){
					cf._tmp = cf._cursor._start-d;
					cf._cursor._last = d;
					if(cf.direction == "horizental")cf._cursor._move = cf._cursor._left - cf._tmp;
					else if(cf.direction == "vertical")cf._cursor._move = cf._cursor._top - cf._tmp;

					if((cf._current == 0) && cf.roll == "true")cf._current_prev = cf._total-1;
					else cf._current_prev = cf._current-1;
					if((cf._current == cf._total-1) && cf.roll == "true")cf._current_next = 0;
					else cf._current_next = cf._current+1;

					if(cf._current_prev != -1 && cf._tmp < 0||cf._current_prev != -1 && cf._total > 3){
						if(cf.direction == "horizental"){
							cf._pos[cf._current_prev] = -t.width();
							t.find("li").eq(cf._current_prev).css("left", cf._cursor._move-_op);
						}else if(cf.direction == "vertical"){
							cf._pos[cf._current_prev] = -t.height();
							t.find("li").eq(cf._current_prev).css("top", cf._cursor._move-_op);
						}
					}

					if(cf._current_prev == -1){
						if(cf._tmp > -parseFloat(_op) * 0.1){
							if(cf.direction == "horizental")t.find("li").eq(cf._current).css("left", cf._cursor._move);
							else if(cf.direction == "vertical")t.find("li").eq(cf._current).css("top", cf._cursor._move);
						}
					}else if(cf._current_next == cf._total){
						if(cf._tmp < parseFloat(_op) * 0.1){
							if(cf.direction == "horizental")t.find("li").eq(cf._current).css("left", cf._cursor._move);
							else if(cf.direction == "vertical")t.find("li").eq(cf._current).css("top", cf._cursor._move);
						}
					}else{
						if(cf.direction == "horizental")t.find("li").eq(cf._current).css("left", cf._cursor._move);
						else if(cf.direction == "vertical")t.find("li").eq(cf._current).css("top", cf._cursor._move);
					}

					if(cf._current_next != cf._total && cf._tmp > 0||cf._current_next != cf._total && cf._total > 3){
						if(cf.direction == "horizental"){
							cf._pos[cf._current_next] = t.width();
							t.find("li").eq(cf._current_next).css("left", cf._cursor._move+_op);
						}else if(cf.direction == "vertical"){
							cf._pos[cf._current_next] = t.height();
							t.find("li").eq(cf._current_next).css("top", cf._cursor._move+_op);
						}
					}

				}else if(event.type == "dragend"||event.type == "touchend"){
					if(!d)cf._cursor._end = cf._cursor._last;
					else cf._cursor._end = d;

					if(((cf._cursor._start-cf._cursor._end) > gap) && !t.find("li:eq("+cf._current+")").is(':animated')){
						if(cf._current_next != cf._total && cf._tmp > 0||cf._current_next != cf._total && cf._total > 3){
							e.next();
						}else{
							if(cf.direction == "horizental"){
								t.find("li").eq(cf._current_prev).animate({"left": -t.width()}, 300);
								t.find("li").eq(cf._current).animate({"left": "0px"}, 300);
							}else if(cf.direction == "vertical"){
								t.find("li").eq(cf._current_prev).animate({"top": -t.height()}, 300);
								t.find("li").eq(cf._current).animate({"top": "0px"}, 300);
							}
						}
					}else if(((cf._cursor._start-cf._cursor._end) < -gap) && !t.find("li:eq("+cf._current+")").is(':animated')){
						if(cf._current_prev != -1 && cf._tmp < 0||cf._current_prev != -1 && cf._total > 3){
							e.prev();
						}else{
							if(cf.direction == "horizental"){
								t.find("li").eq(cf._current).animate({"left": "0px"}, 300);
								t.find("li").eq(cf._current_next).animate({"left": t.width()}, 300);
							}else if(cf.direction == "vertical"){
								t.find("li").eq(cf._current).animate({"top": "0px"}, 300);
								t.find("li").eq(cf._current_next).animate({"top": t.height()}, 300);
							}
						}
					}else{
						if(cf.direction == "horizental")var o = parseFloat(t.find("li").eq(cf._current).css("left"));
						else if(cf.direction == "vertical")var o = parseFloat(t.find("li").eq(cf._current).css("top"));
						if(o > 0||o < 0){
							if(cf._current_prev != -1 && cf._tmp < 0||cf._current_prev != -1 && cf._total > 3){
								if(cf.direction == "horizental"){
									t.find("li").eq(cf._current_prev).animate({"left": -t.width()}, 300);
									cf._pos[cf._current_prev] = -t.width();
								}else if(cf.direction == "vertical"){
									t.find("li").eq(cf._current_prev).animate({"top": -t.height()}, 300);
									cf._pos[cf._current_prev] = -t.height();
								}
							}
							if(cf.direction == "horizental")t.find("li").eq(cf._current).animate({"left": "0px"}, 300);
							else if(cf.direction == "vertical")t.find("li").eq(cf._current).animate({"top": "0px"}, 300);
							if(cf._current_next != cf._total && cf._tmp > 0||cf._current_next != cf._total && cf._total > 3){
								if(cf.direction == "horizental"){
									t.find("li").eq(cf._current_next).animate({"left": t.width()}, 300);
									cf._pos[cf._current_next] = t.width();
								}else if(cf.direction == "vertical"){
									t.find("li").eq(cf._current_next).animate({"top": t.height()}, 300);
									cf._pos[cf._current_next] = t.height();
								}
							}
						}
					}
				}
				event.preventDefault();
			},
			prev : function(){
				if(cf.roll == "true"){
					if(cf._current == 0)cf._current = cf._total-1;
					else cf._current = cf._current-1;

					if(cf.direction == "horizental"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] += t.width();
						t.find("li").each(function(i){$(this).animate({"left": "+=20px"}, 200).animate({"left":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}else if(cf.direction == "vertical"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] += t.height();
						t.find("li").each(function(i){$(this).animate({"top": "+=20px"}, 200).animate({"top":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}
				//roll false
				}else{
					if((cf._current-1) < 0)return;
					else cf._current--;
					if(cf.direction == "horizental"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] += t.width();
						t.find("li").each(function(i){$(this).animate({"left": "+=20px"}, 200).animate({"left":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}else if(cf.direction == "vertical"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] += t.height();
						t.find("li").each(function(i){$(this).animate({"top": "+=20px"}, 200).animate({"top":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}
				}
				e.paging();
			},
			next : function(){
				if(cf.roll == "true"){
					if(cf._current == cf._total-1)cf._current = 0;
					else cf._current = cf._current+1;

					if(cf.direction == "horizental"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] -= t.width();
						t.find("li").each(function(i){$(this).animate({"left": "-=20px"}, 200).animate({"left":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}else if(cf.direction == "vertical"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] -= t.height();
						t.find("li").each(function(i){$(this).animate({"top": "-=20px"}, 200).animate({"top":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}
				//roll false
				}else{
					if((cf._current+1) > (cf._total-1))return;
					else cf._current++;
					if(cf.direction == "horizental"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] -= t.width();
						t.find("li").each(function(i){$(this).animate({"left": "-=20px"}, 200).animate({"left":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}else if(cf.direction == "vertical"){
						for(var i = 0; i < cf._pos.length; i++)cf._pos[i] -= t.height();
						t.find("li").each(function(i){$(this).animate({"top": "-=20px"}, 200).animate({"top":cf._pos[i]}, 300, function(){e.fixlayer()});});
					}
				}
				e.paging();
			},
			view : function(){
				if($("meta[name='viewport']").length < 1){
					var vt = {
						pos:"fixed",
						width:$(window).width(),
						height:$(window).height()
					};
				}else{
					var vt = {
						pos:"absolute",
						width:$("body").width(),
						height:$("body").height()
					};
				}

				var txt = cf._imgs.get(0).src;
				txt = txt.replace("ibooks://", "ibooksimg://");		//iBooks ImgURL Replace

				$("<div\>").attr("class","nw_slider1_clone nw_widget_fullview")
				.css({
					"position":vt.pos,
					"background-image":"url('"+txt+"')",
					"background-size":"contain",
					"background-repeat":"no-repeat",
					"background-position":"center",
					"background-color":"rgba(0,0,0,0.7)",
					"top":"0px",
					"left":"0px",
					"width":vt.width,
					"height":vt.height,
					"z-index":(parseFloat(findHighestZIndex())+2)
				})
				.appendTo("body")
				.click(function(){
					$(this).remove();
				});
			},
			paging : function(){
				t.find("li").each(function(i){
					if(cf._current == i)t.find(".navigation button:eq("+i+")").addClass("active");
					else t.find(".navigation button:eq("+i+")").removeClass("active");
				});
			}
		}
		if(action == "init"){e.init()}
		else if(action == "exe"){e.init();if(document.body.contentEditable != "true")e.exeEvent();}
	}
}

$(function(){nw_slider1.exe()});

/* jquery.event.drag.js ~ v1.5 ~ Copyright (c) 2008, Three Dub Media (http://threedubmedia.com)  
Liscensed under the MIT License ~ http://threedubmedia.googlecode.com/files/MIT-LICENSE.txt */
(function(E){E.fn.drag=function(L,K,J){if(K){this.bind("dragstart",L)}if(J){this.bind("dragend",J)}return !L?this.trigger("drag"):this.bind("drag",K?K:L)};var A=E.event,B=A.special,F=B.drag={not:":input",distance:0,which:1,dragging:false,setup:function(J){J=E.extend({distance:F.distance,which:F.which,not:F.not},J||{});J.distance=I(J.distance);A.add(this,"mousedown",H,J);if(this.attachEvent){this.attachEvent("ondragstart",D)}},teardown:function(){A.remove(this,"mousedown",H);if(this===F.dragging){F.dragging=F.proxy=false}G(this,true);if(this.detachEvent){this.detachEvent("ondragstart",D)}}};B.dragstart=B.dragend={setup:function(){},teardown:function(){}};function H(L){var K=this,J,M=L.data||{};if(M.elem){K=L.dragTarget=M.elem;L.dragProxy=F.proxy||K;L.cursorOffsetX=M.pageX-M.left;L.cursorOffsetY=M.pageY-M.top;L.offsetX=L.pageX-L.cursorOffsetX;L.offsetY=L.pageY-L.cursorOffsetY}else{if(F.dragging||(M.which>0&&L.which!=M.which)||E(L.target).is(M.not)){return }}switch(L.type){case"mousedown":E.extend(M,E(K).offset(),{elem:K,target:L.target,pageX:L.pageX,pageY:L.pageY});A.add(document,"mousemove mouseup",H,M);G(K,false);F.dragging=null;return false;case !F.dragging&&"mousemove":if(I(L.pageX-M.pageX)+I(L.pageY-M.pageY)<M.distance){break}L.target=M.target;J=C(L,"dragstart",K);if(J!==false){F.dragging=K;F.proxy=L.dragProxy=E(J||K)[0]}case"mousemove":if(F.dragging){J=C(L,"drag",K);if(B.drop){B.drop.allowed=(J!==false);B.drop.handler(L)}if(J!==false){break}L.type="mouseup"}case"mouseup":A.remove(document,"mousemove mouseup",H);if(F.dragging){if(B.drop){B.drop.handler(L)}C(L,"dragend",K)}G(K,true);F.dragging=F.proxy=M.elem=false;break}return true}function C(M,K,L){M.type=K;var J=E.event.handle.call(L,M);return J===false?false:J||M.result}function I(J){return Math.pow(J,2)}function D(){return(F.dragging===false)}function G(K,J){if(!K){return }K.unselectable=J?"off":"on";K.onselectstart=function(){return J};if(K.style){K.style.MozUserSelect=J?"":"none"}}})(jQuery);
//]]>