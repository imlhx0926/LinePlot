(function ( $ ) {

	$.fn.iKeypad = function(options) {
		var opts = $.extend( {}, $.fn.iKeypad.defaults, options );

        var isIOS = ((/iphone|ipad/gi).test(navigator.appVersion));
        var touchstart = isIOS ? "touchstart" : "mousedown";
        var touchmove = isIOS ? "touchmove" : "mousemove";
        var touchend = isIOS ? "touchend" : "mouseup";

        var inputValues = [];
		var bgKeypadSize = $('<div class="bigKey" />').css('width');
		bgKeypadSize = bgKeypadSize.substring(0,3)
		//alert(bgKeypadSize);
		var alignment = new Array();
			alignment['left'] = 0;
			alignment['center'] = 139; //bgKeypadSize/2;
			alignment['right']  = 278; //bgKeypadSize-17;
		var id = $(this).closest('.baseKey').attr("id");
        console.log(id);
		this.template = "<div class='input' style='margin-left: "+alignment[opts.align]+"px;'><span class='input'></span><div class='delete'><svg class='delete' width='30' height='24' viewBox='0 0 1024 1024'><g><path d='M921.6 153.6h-489.165c-22.528 0-54.835 12.134-71.782 26.982l-347.955 304.435c-16.947 14.848-16.947 39.117 0 53.965l347.955 304.486c16.947 14.797 49.254 26.931 71.782 26.931h489.165c56.371 0 102.4-46.080 102.4-102.4v-512c0-56.32-46.029-102.4-102.4-102.4zM777.779 716.8l-130.918-130.918-130.816 130.918-73.933-73.882 130.867-130.918-130.867-130.867 73.933-73.933 130.867 130.867 130.867-130.867 73.882 73.933-130.816 130.867 130.867 130.867-73.933 73.933z'></path></g></svg></div></div><div id='keyboardContainer" + id + "' class='keyboardContainer' style='z-index:9999 !important;'><div class='small'></div></div>";
		
		this.character = opts.character;
		this.html = "";
		var $active = false;
        var $fenshu = false;

			// Write keypad button labels
			for(var i in this.character){
				if(this.character[i].indexOf(']')>0){
					var nChar=this.character[i].match(/[^[\]]+(?=])/g).join(' / ');
					this.html +="<div class='key nChar'><span class='nChar'>"+nChar+"</span></div>";  //Write italic chars
				} else {
				    if (this.character[i] == 'Enter'){
					   this.html +="<div class='enter_key'><span>"+this.character[i]+"</span></div>"; //Write 'Enter' key
					}
                    else if (this.character[i] == 'a/b'){
                        var fenshu = '<div class="key nChar">'+
                            '<table class="fenshu" cellspacing="0" cellpadding="0"><tbody>'+
                                '<tr align="center"><td><div class="fenzi">a</div></td></tr>'+
                                '<tr align="center"><td><div class="fenmu">b</div></td></tr>'+
                            '</tbody></table></div>';
                        this.html +=fenshu;
                    }
                    else {
					   this.html +="<div class='key'><span>"+this.character[i]+"</span></div>"; 	  //Write all others 
					}
				}
			}

			$(this).append(this.template) // Figure out which keypad size to use
			if((typeof opts.size )=="string"){
				switch (opts.size){
					case "smallKey":
						break;
					case "mediumKey":
						$(this).find('.input').addClass('_Medium')
						$(this).find('.small').addClass('_Medium')
						break;
					case "bigKey":
						$(this).find('.input').addClass('_Big')
						$(this).find('.small').addClass('_Big')
						break;
				}
						
			} else if((typeof opts.size )=="number"){
				var sizeWidth = opts.size,
				inputSizeW = opts.size-(opts.size*10)/100,
				smallSizeW = opts.size-(opts.size*10)/100;
				$(this).css({"width":sizeWidth+"px"})
				$(this).find('.input').css({"width":inputSizeW+"px"})
				$(this).find('.small').css({"width":smallSizeW+"px"})

			} else {
				console.log("error");
			}

			$(this).find("div.small").append(this.html);

            $('.enter_key').on(touchstart, function(){
                $(this).addClass("_keyActive");
            });

            $('.enter_key').on(touchend, function(){
                toggleClassButton($(this).parent().parent().parent(),"_keyBoardActive");
                $(this).removeClass("_keyActive");
            });

			// Trap keypress events
			$('.key').on(touchstart,function(){
				$(this).addClass("_keyActive")
                if($(this).find("table").length>0){
                    if ($(".editTd").length>0&&$(this).parent().attr("id")=="graphKeypad"){
                        var target = $(".editTd");
                    }
                    else {
                        var target = $(this).parent().parent().siblings(".input").find(".input");
                    }
                    var formula = replaceAll(String.fromCharCode(8211),"-",target.html());
                    var fenzis = formula.split(/[+=()-]/);       //"that is en dash"
                    var fenzi = fenzis[fenzis.length-1];
                    var isNumeric = fenzi.match(/^[0-9]/);
                    console.log(fenzi);
                    if (isNumeric) {
                        console.log(target.html().substr(0,formula.indexOf(fenzi)));
                        target.html(
                            target.html().substr(0,formula.lastIndexOf(fenzi))
                        );
                        target.append(
                            '<table class="fenshu" cellspacing="0" cellpadding="0">' +
                                '<tbody>'+
                                '<tr align="center"><td><div class="fenzi">'+fenzi+'</div></td></tr>'+
                                '<tr><td><span  style="display: none">/</span></td></tr>'+
                                '<tr align="center"><td><div class="fenmu"></div></td></tr>'+
                                '</tbody>' +
                            '</table>'
                        );
                    } else{ fenzi=0;}
                }
			})

			$(this).find('div.key').on(touchend,function(event){
                event.preventDefault()
  				event.stopPropagation()
                if ($fenshu){
                    if($(this).find("table").length>0||!$(this).text().match(/^[0-9]/)){
                        $fenshu= false;
                        $("._keyActive").removeClass("_keyActive");
                        $(this).trigger(touchend);
                    }
                    else{
                        $(this).removeClass("_keyActive");
                        var fenmu =$(this).parent().parent().parent().find('span.input').find(".fenmu").last();
                        fenmu.append($(this).find('span').html());
                    }
                }
				else if($active){
					if($(this).find('span').find("sub").length > 0){
						$active= false;
						$(this).removeClass("_keyActive");
					}

                    else {
						$(this).removeClass("_keyActive");

						var char =$(this).find('span').html();
						var findChar = (/^[a-zA-Z]*$/.test(char))
						var span =$(this).parent().parent().parent().find('span.input')
						var leng = span.text().length;
						if(char.substring(0, 5) == "Enter"){  // Use the 'Enter' key to hide the keyboard
							toggleClassButton($(this).parent(),"_keyBoardActive");	   
						} else {
							if (findChar) {
								if(leng<opts.maxlength)span.html(span.html()+'<sub><i>'+char+'</i></sub>')
								inputValues.push(span.html())
							} else {
								if(leng<opts.maxlength)span.html(span.html()+'<sub>'   +char+    '</sub>')
								inputValues.push(span.html())
							}
						}
					}
				} else {
					if($(this).find("table").length>0){
                        if($fenshu){
                            $fenshu= false;
                        } else {
                            $fenshu = true;
                        }
                    }
                    else if($(this).find('span').find("sub").length > 0){
						if($active){
							$active= false;
						} else {
							$active = true;
						}

					} else {
						$(this).removeClass("_keyActive")

						var char =$(this).find('span').html();
						
						var findChar = (/^[a-zA-Z]*$/.test(char)) // Boolean if upper/lowercase letters
						var span =$(this).parent().parent().parent().find('span.input') // Object
						
						var leng = span.text().length;       // Textfield array position
						if(char.substring(0, 5) == "Enter"){ // Use the 'Enter' key to hide the keyboard
							toggleClassButton($(this).parent(),"_keyBoardActive");						
						} else {
							if (findChar) {
								if(leng<opts.maxlength)span.html(span.html()+'<i>'+char+'</i>') // Write italic characters
								inputValues.push(span.html())
							} else {
								if(leng<opts.maxlength)span.html(span.html()+char)
								inputValues.push(span.html())

							}
						}
					}
				}
			})
			
			$(this).find("div.input").on(touchend,function(event){

				event.preventDefault()
  				event.stopPropagation()

				var tar = $(event.target);
				if(!tar.hasClass('input')){
					//delete
					var lengthInput = inputValues.length;
                    console.log(inputValues);
                    var span=$(this).find('span');
					var htmlVal=span.html();
					var str = span.text();
					str=str.substr(0,str.length-1);
					
					var t = parseInt(lengthInput) -2;
					if(t<0){
						inputValues = []
						span.html('')
					} else {
						span.html(inputValues[t])
						inputValues =inputValues.slice(0,lengthInput-1);
					}
				}else{
					toggleClassButton($(this).parent(),"_keyBoardActive")
				}
			})
			
//toggle class function
var toggleClassButton=function(currentButton,className){
	!currentButton.hasClass(className)? currentButton.addClass(className): currentButton.removeClass(className);
	var id = currentButton.attr("id");
	id = "keyboardContainer" + id;
	var style = document.getElementById(id).style.display
	if (!document.getElementById(id).style.display || document.getElementById(id).style.display == 'none' ){
		$(".keyboardContainer").hide();
	    document.getElementById(id).style.display = "block";
        $('.keyboardContainer[id="'+id+'"]').parent().find(".controlBtnLeft").attr("clickable","false");
        if($('.keyboardContainer[id="'+id+'"]').offset().top>500){
            $('.keyboardContainer[id="'+id+'"]').css("top","-265px");
        };
	} else {
        $('.keyboardContainer[id="'+id+'"]').parent().find(".controlBtnLeft").attr("clickable","true");
        document.getElementById(id).style.display = "none";
	}
}

$('.enter_key').on(touchend, function(event){
	var obj = $(this).parent().parent().attr("id");
	document.getElementById(obj).style.display = "none";
	$(this).removeClass("_keyActive"); 
});

this._getKeypadValue=function (id){
	 /*
 	 @id: string that represents and id, must be without the "#"
 	 note:if there's no id this plugin will return all fields that have been
 	 initilized with the plugin and it's value

	  returns {
	    @value: string with the input value,
	    @target: jquery object that has been find with the given id
	  }
	  on error returns{
	    @value: error message "object is not defined"
	  }
	  */
	if(!id){
		var valueArray=[];
		$(this).each(function(index,elem){
			valueArray.push({
				value:$(this).find('span.input').text(),
				elm:$(elem)
			});
		})
		return valueArray;
	}
 
  var target=$('#'+id);
  var value =target.find('span.input').text();
  if(target.children().length==0){
  	return {value:'object is not defined'}
  } else {
  	return {
  		value:value,
  		target:target
  	}
  }
}

return this;

}

//try to customize it from the plugin call, if it's imperative change this default options.
$.fn.iKeypad.defaults = {
    size: 'smallKey',
	align: 'left',
    character:['+','−','7','8','9','×','÷','4','5','6','.','0','1','2','3'],
    maxlength:20
};

}( jQuery ));


