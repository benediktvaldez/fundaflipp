// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!

(function($){

	'use strict';

	window.fundaflipp = function(wrapEl){
		this.wrapEl = $(wrapEl);
		this.navEls = $('[data-section]');
		this.appEl = $('.fundaflipp-app');
		this.appParentLimitEl = this.appEl.parent('.limit');
		this.appTitleEl = $('.app-title');
		this.appItemControlsEl = this.appEl.find('.item-controls');
		this.appItemsEl = this.appEl.find('.items');
		this.appItemsControlsEl = this.appEl.find('.items-controls');
		this.appResultsEl = this.appEl.find('.results');
		this.appResultsControlsEl = this.appEl.find('.results-controls');
		this.appTemplatesEl = this.appEl.find('.templates');
		this.appSettingsEl = this.appEl.find('.settings');
		this.appSettingsControlsEl = this.appEl.find('.settings-controls');
		this.appFeedbackEl = this.appEl.find('.feedback');
		this.appFeedbackControlsEl = this.appEl.find('.feedback-controls');
		this.getBrowserInformation();
		this.setStorage();
		this.getData();
		this.processSections();
		this.createItems();
		this.attachEvents();

		setTimeout($.proxy(function(){
			$(window).resize($.proxy(this.onResize,this)).resize();
		},this),this.delay);

		if (this.standalone) {
			$("body").addClass('standalone');
		}
	};

	window.fundaflipp.prototype = {

		// vars
		processCount: 0,
		debug: true,
		doReset: false,
		doBlur: false,
		themes: {},
		sections: {},
		data: false,
		live_list: false,
		animationDuration: 250,
		delay: 1000,

		setStorage: function(){
			this.timestamp();
			if (localStorage.getItem('suggest-iphone') === null) localStorage.setItem('suggest-iphone',"true");
			if (localStorage.getItem('list') !== null) {
				this.live_list = JSON.parse(localStorage.getItem('list'));
			} else {
				this.live_list = this.startList();
				localStorage.setItem('list',JSON.stringify(this.live_list));
			}
		},

		timestamp: function(){
			localStorage.setItem('timestamp', Math.round(new Date().getTime() / 1000));
		},

		getData: function(){
			$.ajax({
				url: 'js/db.json',
				success: $.proxy(function(data){
					this.site = data.site;
					this.data = data.livelist;
				},this)
			});
		},

		attachEvents: function(){
			if (this.debug) console.log('attachEvents');

			var obj = this;

			this.navEls.on('click',function(e){
				e.preventDefault();
				var sectionID = $(this).attr('data-section');
				obj.showSection(sectionID,$(this));
			});
			$('.show-iphone').on('click', $.proxy(this.showIphone,this));
			$('.hide-iphone').on('click', $.proxy(this.hideIphone,this));
			$('.full-iphone').on('click', $.proxy(this.fullIphone,this));
			$('.finalize').on('click',$.proxy(this.finalize,this));
			$('.clear-all').on('click',$.proxy(this.clearListConfirm,this));
			$('.go-back').on('click',$.proxy(this.goBack,this));
			$('.add-item').on('click',$.proxy(this.addItem,this));
			$('.remove-item').on('click',$.proxy(this.removeItem,this));
			$('.activate-settings').on('click',$.proxy(this.activateSettings,this));
			$('.save-settings').on('click',$.proxy(this.saveSettings,this));
			$('.feedback').on('click',$.proxy(this.feedback,this));

			setTimeout(function(){
				if (localStorage.getItem('suggest-iphone') == "true") $('.iphone').removeClass('opt-out');
			},1500);
		},

		finalize: function(e){
			e.preventDefault();
			var itemEl = $(e.currentTarget);
			if (itemEl.hasClass("disabled")) return;
			this.appResultsEl.children('.result').remove();

			$.each(this.live_list.items,$.proxy(function(index,item){
				this.addResult(item,this.selectPhrase());
			},this));

			this.appTitleEl.html('Niðurstöður');
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			if (this.appResultsEl.children('.result').length <= 0) this.appResultsEl.html($('<h6>').text('Nauðsynlegt er að slá inn nöfn fyrst!'));
			this.appResultsEl.show();
			this.appResultsControlsEl.show();
			// this.clearList();
		},

		goBack: function(e){
			e.preventDefault();
			this.appTitleEl.html('Þátttakendur');
			this.appParentLimitEl.addClass('small');
			this.appItemsEl.show();
			this.appItemsControlsEl.show();
			this.appItemControlsEl.show();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.processItems();
		},

		startList: function(){
			return {
				"items": []
			};
		},

		updateList: function(){
			delete this.live_list.items;
			this.live_list.items = [];

			this.appEl.find('.items').find('.item').each($.proxy(function(index,item){
				var new_item = {
					"index": $(item).attr('data-index'),
					"name": $(item).children('input[type="text"]').val()
				};
				this.live_list.items[index] = new_item;
			},this));

			if (this.live_list.items.length == 1 && this.live_list.items[0].name === "") {
				$('.clear-all').addClass('disabled');
				$('.finalize').addClass('disabled');
			} else {
				$('.clear-all').removeClass('disabled');
				$('.finalize').removeClass('disabled');
			}

			localStorage.setItem('list',JSON.stringify(this.live_list));
			this.timestamp();
		},

		clearListConfirm: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if(confirm("Þessi virkni eyðir öllum nöfnum út af listanum þínum. Ertu viss um að þú viljir halda áfram?")) {
				this.clearList();
				this.appEl.find('.items').find('.item').remove();
				this.createItems();
			}
		},

		clearList: function(){
			this.live_list = this.startList();
			localStorage.setItem('list',JSON.stringify(this.live_list));
		},

		createItems: function(){
			if (this.live_list.items.length > 0) {
				$.each(this.live_list.items,$.proxy(function(index,item){
					if(item === null) return;
					this.addItemManual(item);
				},this));
				this.processItems();
			} else {
				this.addItem();
			}
		},

		processItems: function(){
			var items = this.appEl.find('.items').find('.item');

			this.clearList();
			items.each($.proxy(function(index,item){
				// index++;
				$(item).attr('data-index',index);
				this.appEl.attr('data-count',index);
				$(item).children('input[type="text"]')
					.off("click")
						.on("click",function(e){$(e.currentTarget).focus();})
					.off("click")
						.on("click",function(e){e.preventDefault();})
					.off("blur")
						.on("blur",$.proxy(this.itemBlur,this))
					.off("focus")
						.on("focus",$.proxy(this.itemFocus,this))
					.off("keydown")
						.on("keydown",function(e){
							if(e.which == 13) e.preventDefault();
						})
					.off("keyup")
						.on("keyup",$.proxy(this.itemUpdate,this));
				if(index+1 >= items.length) setTimeout(function(){$(item).children('input[type="text"]').focus();},0);
				this.updateList();
			},this));

			this.processCount = this.processCount + 1;
		},

		itemFocus: function(e){
			var itemEl = $(e.currentTarget),
				itemIndex = itemEl.parent('.item').attr('data-index'),
				newTop = itemIndex * (itemEl.parent('.form').outerHeight() + parseInt(itemEl.parent('.form').css('margin-bottom'),10));

			this.appItemControlsEl.removeClass("inactive").css({"top":newTop}).attr('data-active',itemIndex);
			this.appItemsEl.removeClass("inactive");
			clearTimeout(this.doBlur);

			if (this.appEl.find('.items').find('.item').length == 1) {
				this.appItemControlsEl.find('.icon-minus').removeClass('icon-minus').addClass('icon-blocked disabled');
			} else {
				this.appItemControlsEl.find('.icon-blocked').removeClass('icon-blocked disabled').addClass('icon-minus');
			}
		},

		itemBlur: function(e){
			if(this.doBlur !== false);
				clearTimeout(this.doBlur);
			this.doBlur = setTimeout($.proxy(function(){
				this.appItemControlsEl.addClass("inactive");
				this.appItemsEl.addClass("inactive");
			},this), 100);

		},

		itemUpdate: function(e){
			var itemEl = $(e.currentTarget),
				itemIndex = itemEl.parent('.item').attr('data-index');
			if (e.which == 13) {
				this.addItem();
			}

			this.updateList();
		},

		removeItem: function(e){
			if (this.debug) console.log('removeItem');
			e.preventDefault();
			var itemEl = $(e.currentTarget),
				itemActive = parseInt(itemEl.parent('.inside').parent('.item-controls').attr('data-active'),10);
			if(itemEl.hasClass('disabled')) return this.clearListConfirm();
			this.appItemsEl.find('[data-index=' + itemActive + ']').remove();
			this.processItems();
			this.updateList();
		},

		removeItemManual: function(item) {
			if (this.debug) console.log(item);
		},

		addItem: function(e){
			if (e) e.preventDefault();
			this.appTemplatesEl.find('.item').clone().appendTo('.items');
			this.processItems();
		},

		addItemManual: function(item){
			this.appTemplatesEl.find('.item').clone().appendTo('.items').find('input').attr('data-index',item.index).val(item.name);
		},

		addResult: function(item,phrase){
			if(item.name === "") return this.removeItemManual(item);
			this.appTemplatesEl.find('.result').clone().appendTo('.results').find('input').val(item.name).attr('disabled','disabled').siblings('.phrase').html(phrase);
		},

		selectPhrase: function(){
			return this.data[this.rand(0,this.data.length-1)];
		},

		processSections: function(){
			this.wrapEl.find('[data-sectionid]').each($.proxy(function(index,item){
				var sectionID = $(item).attr('data-sectionid');
				this.sections[index] = sectionID;

				var theme = $(item).attr('data-theme');
				if (typeof(theme) != 'undefined' && theme !== '') this.themes[theme] = theme;
			},this));
		},

		showSection: function($sectionID,$linkEl){
			var sectionID = typeof($sectionID) !== 'undefined' && $sectionID !== '' ? $sectionID : "home";
			var linkEl = typeof $linkEl != 'undefined' && $linkEl !== "" ? $linkEl : $('[data-section="' + sectionID + '"]');
			var sectionEl = $('[data-sectionid="' + sectionID + '"]');
			if (this.debug) console.log('-showSection - ' + sectionID);

			$('[data-sectionid]:not([data-sectionid="' + sectionID + '"])').hide();

			if(sectionTheme && $('body').hasClass(sectionTheme)) return;

			$.each(this.themes,function(key,value){
				$('body').removeClass(value);
			});

			var sectionTheme = sectionEl.attr('data-theme');
			if (sectionTheme !== '' && typeof(sectionTheme) !== 'undefined' && $.inArray(sectionTheme,this.themes)) $('body').addClass(sectionTheme);

			linkEl.parent().parent().find('li').find('a').removeClass('selected');
			linkEl.addClass('selected');
			var position = linkEl.offset();
			var newWidth = linkEl.width();

			if(linkEl.attr('data-noselect') == 'true') {
				// $('.selected-item').addClass('hidden');
			} else {
				$('.selected-item').removeClass('hidden').addClass('active').css({'width':newWidth,'left':position.left});
			}

			sectionEl.show();
			setTimeout(function(){
			},this.animationDuration);
		},

		showIphone: function(e){
			e.preventDefault();
			$('.iphone').removeClass('opt-out');
			localStorage.setItem('suggest-iphone',"true");
		},

		hideIphone: function(e){
			e.preventDefault();
			$('.iphone').addClass('opt-out');
			localStorage.setItem('suggest-iphone',"false");
		},

		fullIphone: function(e){
			var itemEl = $(e.currentTarget);
			this.hideIphone(e);
			this.showSection('iphone',itemEl);
		},

		activateSettings: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if (this.debug) console.log('activateSettings');
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.appParentLimitEl.removeClass('small');
			this.appSettingsEl.children('.setting').remove();

			this.appTitleEl.html('Stillingar');
			this.appSettingsEl.show();
			this.appSettingsControlsEl.show();

			$.each(this.site,$.proxy(this.addSetting,this));
		},

		addSetting: function(index,item){
			var itemTitle = typeof item.title !== 'undefined' && item.title !== "" ? item.title : index;
			var itemValue = typeof item.value !== 'undefined' && item.value !== "" ? item.value : item;

			this.appTemplatesEl.find('.setting').clone().appendTo('.settings').find('label').html(itemTitle).siblings('input').val(itemValue);
		},
		saveSettings: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			alert('Ekki í boði eins og er!');
		},

		feedback: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if (this.debug) console.log('feedback');
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();

			this.appTitleEl.html('Feedback');
			this.appFeedbackEl.show();
			this.appFeedbackControlsEl.show();

		},

		onResize: function(){
			if(this.doReset !== false);
				clearTimeout(this.doReset);
			this.doReset = setTimeout($.proxy(this.resizeFix,this), 750);
		},

		resizeFix: function(){
			$('[data-section].selected').trigger('click');
		},

		rand: function(min, max) {
		  return Math.floor(Math.random() * (max - min + 1)) + min;
		},

		getBrowserInformation: function(){
			this.isLegacy = $('.lt-ie9').length > 0;

			var agent = window.navigator.userAgent;
			var android = agent.indexOf('Android ');
			var ios = agent.indexOf('OS ');

			this.standalone = window.navigator.standalone;

			this.iosVersion = ios > -1 ? window.Number(agent.substr(ios + 3, 3).replace('_', '.')) : 0;
			this.isIOS = this.iosVersion > 0;
			this.isIOS4 = this.iosVersion > 4 && this.iosVersion < 5;
			this.isIOS6 = this.iosVersion > 6 && this.iosVersion < 7;

			this.androidVersion = android > -1 ? window.Number(agent.substr(android + 8, 3)) : 0;
			this.isAndroid2 = this.androidVersion === 2;
		}
	};

}(jQuery));

$(function(){
	var fundaflipp = new window.fundaflipp("html");
	if (fundaflipp.debug) console.log(fundaflipp);
});