 var EventCenter = {
	on: function(type,handler){
		$(document).on(type,handler)
	},
	fire: function(type,data){
		$(document).trigger(type,data)
	}
}

var Footer = {
	//初始化页面
	init: function(){
		this.$footer = $('footer');
		this.$ul = this.$footer.find('ul');
		this.$box = this.$footer.find('.box');
		this.$leftBtn = this.$footer.find('.fa-chevron-left');
		this.$rightBtn = this.$footer.find('.fa-chevron-right');
		this.isToEnd = false;  //判断点击轮播是不是到最后了
		this.isToStart = true;
		this.isAnimate = false;  //状态锁

		this.bind();
		this.render();
		EventCenter.fire('select-albumn',)
	},
	//绑定事件
	bind: function(){
		var _this = this;

        //点击右边的icon 往左移动
		this.$rightBtn.on('click',function(){
			if(_this.isAnimate) return;
			var itemWidth = _this.$box.find('li').outerWidth(true);
			var rowCount = Math.floor(_this.$box.width()/itemWidth);
            
            //给个判断条件
			if(!_this.isToEnd){
				//状态锁
				_this.isAnimate = true;
				//自定义动画
				_this.$ul.animate({
	               left: '-=' + itemWidth * rowCount
				}, 400, function(){
					//状态锁
					_this.isAnimate = false;
					_this.isToStart = false;
					//如果盒子的宽度 + 往左偏移的宽度 >= ul的宽度，则不再移动
					if(_this.$box.width() - parseInt(_this.$ul.css('left')) >= _this.$ul.width()){
						_this.isToEnd = true;					    
					}
			    })
			}
		})
        
        //点击左按钮往右移动
		this.$leftBtn.on('click',function(){
			if(_this.isAnimate) return;
			var itemWidth = _this.$box.find('li').outerWidth(true);
			var rowCount = Math.floor(_this.$box.width()/itemWidth);
            
			if(!_this.isToStart){
				_this.isAnimate = true;
				//自定义动画
				_this.$ul.animate({
					left: '+=' + itemWidth * rowCount
				},400,function(){
					_this.isAnimate = false;
					_this.isToEnd = false;
					//如果往左偏移的宽度为0，则不再往右移动
					if(parseInt(_this.$ul.css('left')) >= 0){
						_this.isToStart = true;
					}
				})
			}
		})
        
        //点击后的状态 运用事件代理
		this.$footer.on('click','li',function(){
			$(this).addClass('active')
			       .siblings().removeClass('active');
            
            //自定义事件 把类别和类名 name 放进去
			EventCenter.fire('select-albumn',{
				channelId: $(this).attr('data-channel-id'),
				channelName: $(this).attr('data-channel-name')
			})
		})
	},
    
    //渲染页面
	render: function(){
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
         .done(function(ret){
         	console.log(ret);
         	//渲染数据
	        _this.renderFooter(ret.channels);
	      }).fail(function(){
	        console.log('err');
	      })
	},

	//数据放到页面上
	renderFooter: function(channels){
		console.log(channels);
		var html = '';
		channels.forEach(function(channel){
			//拼接字符串
			html += '<li data-channel-id=' + channel.channel_id + ' data-channel-name='+ channel.name +'>'
			+' <div class="cover" style="background-image:url(' + channel.cover_small + ')"></div>'
			+' <h3>' + channel.name + '</h3>'
			+'</li>';
		})
		this.$ul.html(html);
		//设置样式
		this.setStyle();
	},

	//设置样式
	setStyle: function(){
		//多少个li
		var count = this.$footer.find('li').length;
		//每个li的宽度 包括外边框
		var width = this.$footer.find('li').outerWidth(true);
		this.$ul.css({
			width: count * width + 'px'
		})
	}
}


var Fm = {
	init: function(){
	   this.$container = $('#page-music');
	   this.audio = new Audio();
       this.audio.autoplay = true;

       this.bind();
       this.loadMusic();
	},
	bind: function(){
	    var _this = this;
		EventCenter.on('select-albumn',function(e,channelObj){
			_this.channelId = channelObj.channelId;
			_this.channelName = channelObj.channelName;
			_this.loadMusic();
		})

		this.$container.find('.btn-play').on('click',function(){
			var $btn = $(this);
		    if($btn.hasClass('fa-play')){
		    	$btn.removeClass('fa-play').addClass('fa-pause');
		    	_this.audio.play();
		    } else {
		    	$btn.removeClass('fa-pause').addClass('fa-play');
		    	_this.audio.pause();
		    }
		})

		this.$container.find('.btn-next').on('click',function(){
			_this.loadMusic();
		})

		this.audio.addEventListener('play',function(e){
			clearInterval(_this.statusClock);
           _this.statusClock = setInterval(function(){
           	_this.updataStatus();
            },800)
		})
		this.audio.addEventListener('pause',function(){
			clearInterval(_this.statusClock);
		})

		this.$container.find('.area-bar .bar').on('click',function(e){
			console.log($(this).outerWidth(),e.clientX,getComputedStyle(this).width)
			var percent = e.offsetX/$(this).outerWidth();
			_this.audio.currentTime = percent * _this.audio.duration;
		})

		this.audio.onended = function(){
			_this.loadMusic();
		}
	},
	loadMusic: function(callback){
		var _this = this;
		$.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel: _this.channelId})
		 .done(function(ret){
		 	console.log(ret)
		 	_this.song = ret['song'][0];
            _this.setMusic();
            _this.loadLyric();
		 })
	},

	loadLyric: function(){
		var _this = this;
		$.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid: _this.song.sid}).done(function(ret){
			console.log(ret);
			var lyric = ret.lyric;
			var lyricObj = {};
			lyric.split(/\n/).forEach(function(line){
				var times = line.match(/\d{2}:\d{2}/g)
				var str = line.replace(/\[.+?\]/g,'');
				if(Array.isArray(times)){
					times.forEach(function(time){
						lyricObj[time] = str;
					})
				}
				_this.lyricObj = lyricObj;
			})
			
		})
  
	},

	setMusic: function(){
		console.log(this.song);
        this.audio.src = this.song.url;
        $('.bg').css('background-image','url(' + this.song.picture + ')');
        this.$container.find('.aside figure').css('background-image','url(' + this.song.picture + ')');
        this.$container.find('.detail h1').text(this.song.title);
        this.$container.find('.detail .author').text(this.song.artist);
        this.$container.find('.detail .tag').text(this.channelName);
        this.$container.find('.btn-play').removeClass('fa-play').addClass('fa-pause');
	},
	updataStatus: function(){
		var min = Math.floor(this.audio.currentTime/60);
		var second = Math.floor(this.audio.currentTime%60)+'';
		second = second.length === 2?second : '0' + second;
		this.$container.find('.current-time').text(min+':'+second);

        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration * 100 + '%');

        var line = this.lyricObj['0'+min+':'+second];
        if(line){
        	this.$container.find('.lyric p').text(line).boomText();
        }
	}

}

$.fn.boomText = function(type){
	type = type || 'rollIn';
	this.html(function(){
		var arr = $(this).text().split('')
		                 .map(function(word){
		     return '<span class="boomText">' + word + '</span>';
		})
		return arr.join('');
	})

	var index = 0;
	var $boomtexts = $(this).find('span');
	var clock = setInterval(function(){
		$boomtexts.eq(index).addClass('animated ' + type)
		index ++
		if(index >= $boomtexts.length){
			clearInterval(clock)
		}
	},300)
}

Footer.init();
Fm.init();
