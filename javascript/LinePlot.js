var Colors = {
    bg: "#ffffff",
    obj: "#000000",
    grid: "#81DAF5",
    keyPoint: "ff0000"
};


LinePlot = function () {
    centerX = $("#canvasDiv").width() / 2;
    centerY = $("#canvasDiv").height() / 2;
    scaleWorld = 40;
    scaleXY = 1;
    smooth = 1;
    harnessOffset = $("#canvasDiv").offset().top;
    this.gridScale = 40;
    this.graphMode = false;
    this.sketchMode = false;
    this.graphArray = new Array();
    this.colorScheme = [
        "#FF0000","#00BBBB","#FF6600","#BBBB00","#000077","#007777",//"#000000","#000000","#000000","#000000",
        "#770077","#777700","#770000",//"#000000","#000000","#000000","#000000",
        "#0000FF","#BB00BB","#007700"//"#000000","#000000","#000000","#000000",
        //"#FF00FF","#808080","#000000","#000000","#000000","#000000","#000000","#000000",
    ];
    this.colorIndex = Math.floor(12*Math.random());
    Object.defineProperty(this, "color", {
        set: function (value) {
        },
        get: function () {
            this.colorIndex++;
            if (this.colorIndex==this.colorScheme.length) this.colorIndex = 0;
            return this.colorScheme[this.colorIndex];
        },
        enumerable: true,
        configurable: true
    });

    objects = new Array();
    var x_axis = {
        A:0,B:1,C:0,
        type: "ray",
        id: "x_axis",
        enabled: true
    };
    var y_axis = {
        A:1,B:0,C:0,
        type: "ray",
        id: "y_axis",
        enabled: true
    };
    objects.push(x_axis);
    objects.push(y_axis);

//    keyPoints = new Array();
    intersectPoints = new Array();
    showCoord = false;
    this.startX = 0;
    this.startY = 0;
    this.startXB = 0;
    this.startYA = 0;
    this.startXA = 0;
    this.startYB = 0;
    this.startScale=40;
    this.startCenterX = 0;
    this.startCenterY = 0;
    this._interval = [2, 2, 2.5];            //increment = 2
    this._intervalIndex = 1;
    this.dragging = false;
    Object.defineProperty(this, "interval", {
        set: function (value) {
            this._intervalIndex += value;
            if (this._intervalIndex==3){
                this._intervalIndex=0;
            }
            else if (this._intervalIndex==-1){
                this._intervalIndex=2;
            }
        },
        get: function () {
            return this._interval[this._intervalIndex];
        },
        enumerable: true,
        configurable: true
    });
}

LinePlot.prototype = {
    init: function (initState) {
        var self = this;
        var isIOS = ((/iphone|ipad/gi).test(navigator.appVersion));
        var touchstart = isIOS ? "touchstart" : "mousedown";
        var touchmove = isIOS ? "touchmove" : "mousemove";
        var touchend = isIOS ? "touchend" : "mouseup";
        var sketchColor = ""; var sketchObj = null; var sketchPoint = null;


        $(document).on(touchend, ".keyboardContainer .enter_key", function(){
            var formula =$(this).parent().parent().siblings(".input").find(".input").text();
            if (formula=="") return;
            var controlRow = $(this).parent().parent().parent();
            var color =  controlRow.attr("id");
            console.log(color);
            self.removeLine(color);
            var line;

            try{
                line = self.plot(formula, color);
                console.log("line", line);
            }
            catch(error){
                console.log(error);
                line = "invalid";
            };

            if (line=="invalid"||line==undefined){
                controlRow.find(".warningSign").show();
                controlRow.find(".controlBtnLeft").attr("clickable","false");
                controlRow.find(".dataSign").hide();
            }
            else {
                controlRow.find(".dataSign").show();
                controlRow.find(".controlBtnLeft").attr("clickable","true");
                controlRow.find(".controlBtnLeft").css("background-color",color);
                controlRow.find(".warningSign").hide();
            }
            controlRow.find(".keyboardContainer").attr("id", "keyboardContainer"+color);
            controlRow.removeClass("_keyBoardActive");
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        });

        $(document).on(touchend, '.controlBtnRight', function(event){
            var id = $(this).parent().attr("id");
            $(this).parent().remove();
            self.removeLine(id);
            self.refreshFinalCanvas();
            self.drawKeyPoints();
            $('.tableDiv[id="tableDiv'+id+'"]').remove();
            $('.sketchColor[color='+id+']').parent().remove();
            $('.lineColor[color='+id+']').parent().remove();

            $(".controlBtnLeft").each(function(btn){
                $(this).html($(".controlBtnLeft").index($(this))+1);
            });
        });

        $(document).on(touchend, '.controlBtnLeft', function(event){
            if ($(this).attr("clickable")=="false") return;
            var id = $(this).parent().attr("id");
            self.hideLine(id);
            self.refreshFinalCanvas();
            self.drawKeyPoints();
            if ($(this).css("background-color")==$(this).siblings(".controlBtnRight").css("background-color")){
                $(this).css("background-color","#BBBBBB");
            }
            else{
                $(this).css("background-color",id);
            }

        });

        $(document).on(touchstart, '#graphKeypad .key', function(event){
            $(this).addClass("_keyActive");
        });
        $(document).on(touchend, '#graphKeypad .key', function(event){
            $(this).removeClass("_keyActive");
            if ($(this).find("table").length>0){
//                $(".editTd")[0].innerHTML="";
            }
            else if ($(this).find("span").text()=='<<='){
                if ($(".editTd").find(".fenshu").length>0){
                    $(".editTd").find(".fenshu").remove();
                }
                else
                    $(".editTd")[0].innerHTML=$(".editTd")[0].innerHTML.slice(0,$(".editTd")[0].innerHTML.length-1);
            }
            else if ($(this).text()=='Next'){
                if ($(".editTd").length==0) return;
                else if ($(".editTd").last().next().length>0){
                    $(".editTd").last().next().addClass("editTd");
                }
                else if ($(".editTd").parent().next().length>0){
                    $(".editTd").parent().next().children().first().addClass("editTd");
                }
                else if ($(".editTd").parent().next().length==0){
                    $("#graphTable tbody").append("<tr><td></td><td></td></tr>");
                    $("#graphTable tbody tr").last().children().first().addClass("editTd");
                }
                $(".editTd").first().removeClass("editTd");
            }
            else if($(".editTd").find(".fenmu").length>0){
                $(".editTd").find(".fenmu").append($(this).text());
            }
            else $(".editTd")[0].innerHTML+=$(this).text();
            self.updateGraphTable();
        });

        $(document).on(touchend, '#graphTable td', function(event){
            if ($("#graphKeypad").css("display")=="none") $("#graphKeypad").show();
            if ($(this).hasClass("editTd")){
                $(this).removeClass("editTd");
            }
            else{
                $(".editTd").removeClass("editTd");
                $(this).addClass("editTd");
            }
        });

        $(document).on(touchend, '.addItem', function () {
            if ($(".controlRow").length==12){
                return;
            }
            $("#controlDiv").append(
                '<div class="controlRow baseKey">'+
                '<div class="controlBtnLeft" clickable="false">'+ ($(".controlRow").length+1) +'</div>'+
                    '<div class="warningSign">!</div>'+
                    '<div class="dataSign">f(x)</div>'+
                    '<div class="controlBtnRight"></div>'+
                '</div>'
            );
            var color = self.color;
            $(".dataSign").last().css("background-color", color);
            $(".controlBtnLeft").last().css("background-color", color);
            $(".controlBtnRight").last().css("background-color", color);
            $('.controlRow').last().attr("id", color );
            $('.controlRow').last().iKeypad({
                size:'bigKey',
                align:'left',
                character: ['[x]','+','1','2','3','<span style="display:none">^</span><sup>2</sup>',
                            '[y]','&#8211','4','5','6','',
                            '(',')','7','8','9','',
                            'a/b','=','.','0','Enter'],
                maxlength:30
            });
            $("#labelTable table").append('<tr style="color:'+color+'"><td class="lineColor" color="'+color+'" >&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211</td><td class="sketchLabel" contenteditable=true></td></tr>');

            // Tong's code
            $('.appWrap').append(
                '<div id="tableDiv'+ color +'" class="tableDiv">'+
                    '<table border="1">' +
                    '</table>'            +
                    '<div class="hideTableDiv" type="button" onclick="$(this).parent().hide()"></div>' +
                '</div>'
            );

            var nameTemp = "tableDiv" + color;
            console.log(nameTemp);
            $('.tableDiv[id="'+nameTemp+'"]').draggable({
                start: function() {
                    var zindextemp=parseInt($(this).css("z-index"))+1;
                    $(this).css("z-index",zindextemp);
                    $('.tableDiv').not(this).css("z-index","1002");
                }
            });
            // Tong's code

        });

        $(document).on(touchend, '.addGraph', function () {
            if ($(".controlRow").length==12){
                return;
            }
            $("#controlDiv").append(
                '<div class="controlRow tableRow">'+
                    '<div class="controlBtnLeft">'+ ($(".controlRow").length+1) +'</div>'+
                    '<img class="tableImg" src="image/table.png" height="24" width="24">'+
                    '<img class="graphImg" src="image/graph.png" height="24" width="24">'+
                    '<input type="range" class="smoothfactor" min="0" max="1" step="0.05"/>'+
                    '<div class="controlBtnRight"></div>'+
                    '</div>'
            );
            var color = self.color;
            $(".controlBtnLeft").last().css("background-color", color);
            $(".controlBtnRight").last().css("background-color", color);
            $(".tableRow").last().find("img").css("background-color", color);
            $('.controlRow').last().attr("id", color );
            var graph = new Graph({
                type: "graph",
                array: [],
                id: color,
                sf: 0.5
            });
            objects.push(graph);
            $("#labelTable table").append('<tr style="color:'+color+'"><td class="sketchColor" color="'+color+'" >&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211</td><td class="sketchLabel" contenteditable=true></td></tr>');
        });

        $(document).on(touchend, '.addTable', function () {
            if ($(".controlRow").length==12){
                return;
            }
            $("#controlDiv").append(
                '<div class="controlRow tableRow">'+
                    '<div class="controlBtnLeft">'+ ($(".controlRow").length+1) +'</div>'+
                    '<img class="tableImg" src="image/table.png" height="24" width="24">'+
                    '<img class="graphImg" src="image/graph.png" height="24" width="24">'+
                    '<input type="range" class="smoothfactor" min="0" max="1" step="0.05"/>'+
                    '<div class="controlBtnRight"></div>'+
                    '</div>'
            );
            var color = self.color;
            $(".controlBtnLeft").last().css("background-color", color);
            $(".controlBtnRight").last().css("background-color", color);
            $(".tableRow").last().find("img").css("background-color", color);
            $('.controlRow').last().attr("id", color );
            var graph = new Graph({
                type: "graph",
                array: [],
                id: color,
                sf: 0.5
            });
            objects.push(graph);
            $("#labelTable table").append('<tr style="color:'+color+'"><td class="sketchColor" color="'+color+'" >&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211&#8211</td><td class="sketchLabel" contenteditable="true"></td></tr>');
        });

        $(document).on("change", ".smoothfactor", function(){
            var id = $(this).parent().attr("id");
            var sf = $(this)[0].value;
            objects.forEach(function(selected){
                if (selected.type=="graph"&&selected.id==id){
                    selected.sf = sf;
                    self.refreshFinalCanvas();
                }
            });
        });

        $(document).on(touchend, '.graphImg', function () {
            var id = $(this).parent().attr("id");
            var graph = findObject(id);
            if (self.graphMode){
                $(".graphImg").css("opacity",1.0);
                self.graphMode = false;
                if (graph.array.length==0){
                    $("#msgBox").fadeOut();
                    graph.array = self.graphArray;
                    self.graphArray = new Array();
                    self.refreshFinalCanvas();
                }
                else if(findObject(id).array.length>0){
                    sketchObj=null;
                }
            }
            else {
                $(this).css("opacity",0.5);
                self.graphMode = true;
                if (graph.array.length==0){
                    $("#msgBox").fadeIn();
                }
                else if(graph.array.length>0){
                    sketchObj=graph;
                }
            }
        });

        $(document).on(touchend, '.tableImg', function () {
            $("#graphTableDiv").show();
            $("#graphTableDiv").css("color",$(this).parent().attr("id"));
            $(".keyboardContainer").hide();
            if ($("#graphTable tbody").length==0) $("#graphTable").append('<tbody></tbody>');

            $("#graphTable tbody").html('');
            var existed = false;
            var table;
            var id = $(this).parent().attr("id");
            $("#graphTableDiv").attr("graphId",$(this).parent().attr("id"));
            objects.forEach(function(graph){
                if(graph.type=="graph"&&graph.id==id){
                    existed=true;table = graph.array;
                    if (graph.connected)
                        $("#plotGraph").html("DISCONNECT");
                    else
                        $("#plotGraph").html("CONNECT");
                }
            });
            if (existed){
                table.forEach(function(point){
                    if (point.x==undefined||point.y==undefined) return;
                    var i_display = Math.round(point.x*100)/100;
                    var j_display = Math.round(point.y*100)/100;
                    i_display = i_display<0?String.fromCharCode(8211)+-i_display:i_display;
                    j_display = j_display<0?String.fromCharCode(8211)+-j_display:j_display;
                    $("#graphTable tbody").append(
                        '<tr><td>'+i_display+'</td><td >'+j_display+'</td></tr>'
                    );
                });
            }
            else{
                $("#graphTable tbody").append(
                    '<tr><td ></td><td ></td></tr>'+
                    '<tr><td ></td><td ></td></tr>'+
                    '<tr><td ></td><td ></td></tr>'+
                    '<tr><td ></td><td ></td></tr>'+
                    '<tr><td ></td><td ></td></tr>'
                );
            }
        });

        $(document).on(touchend, '#hideGraphTable', function () {
            $(this).parent().hide();
            $("#graphKeypad").hide();
            self.graphArray = [];
            self.refreshFinalCanvas();
        });
        $(document).on(touchend, '#randomGraph', function () {
            var rightbottom = S2W({
                x:$("#canvasDiv").width(),
                y:$("#canvasDiv").height()
            });
            var lefttop = S2W({x:0,y:0});
            var y=0;
            $("#graphTable td").each(function(){
                if ($(this).text()==""){
                    y = rightbottom.y+(lefttop.y-rightbottom.y)*Math.random();
                    $(this).text(Math.round(y*1000)/1000);
                }
            });
        });
        $(document).on(touchend, '#plotGraph', function () {
            var array = new Array();
            var id = $(this).parent().attr("graphId");
            var headerX = $("#graphTable thead th:nth(0)").text();
            var headerY = $("#graphTable thead th:nth(1)").text();
            $("#graphTable tr").each(function(){
                var x = replaceAll(String.fromCharCode(8211),'-',$(this).find("td:nth(0)").text());
                var y = replaceAll(String.fromCharCode(8211),'-',$(this).find("td:nth(1)").text());
                if (x!=""&&y!=""){
                    array.push({x:parseFloat(x), y:parseFloat(y)});
                }
            });
            var graph = findObject(id);
            if ($(this).text()=="DISCONNECT"){
                $(this).html("CONNECT");
                graph.connected=false;
            }
            else if ($(this).text()=="CONNECT"){
                $(this).html("DISCONNECT");
                graph.connected=true;
            }
            self.refreshFinalCanvas();
        });


        $(document).on(touchend, '.slideClose', function () {
            if ($(".slideClose").css("content").indexOf("SlideClose.png")!=-1){
                $(".controlRow").hide();
                $(".addTable").hide();$(".addGraph").hide();$(".coordBtn").hide();
                $("#controlDiv").css("height",$(".controlHeader").height()+20);
                $("#controlDiv").css("width",30);
                $(".slideClose").css("content", 'url("image/SlideOpen.png")');
            }
            else if ($(".slideClose").css("content").indexOf("SlideOpen.png")!=-1){
                $(".controlRow").show();
                $(".addTable").show();$(".addGraph").show();$(".coordBtn").show();
                $("#controlDiv").css("height","auto");
                $("#controlDiv").css("width",314);
                $(".slideClose").css("content", 'url("image/SlideClose.png")');
            }
            var canvasWidth = $("#canvasDiv").css("width");
            $("canvas").attr("width", canvasWidth);
            self.drawGrid();
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        });

        $(document).on(touchend, '#zoomInBtn', function () {
            if (scaleWorld==20000) return;
            var focus = S2W({
                x: $("#canvasDiv").width() / 2,
                y: $("#canvasDiv").height() / 2
            });
            var scaleTo = scaleWorld*self.interval;
            self.changeScale(scaleWorld, scaleTo, focus);
        });

        $(document).on(touchend, '#refreshBtn', function () {
            scaleWorld = 40;
            self.gridScale = 40;
            centerX = $("#canvasDiv").width() / 2;
            centerY = $("#canvasDiv").height() / 2;
            self._intervalIndex = 1;
            self.drawGrid();
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        });

        $(document).on(touchend, '#zoomOutBtn', function () {
            if (scaleWorld==0.4) return;
            var focus = S2W({
                x: $("#canvasDiv").width() / 2,
                y: $("#canvasDiv").height() / 2
            });

            self.interval = -1;
            var scaleTo = scaleWorld/self.interval;
            self.interval = +1;

            self.changeScale(scaleWorld, scaleTo, focus);
//            scaleWorld = scaleTo;
//
//            var shiftFocusX = $("#canvasDiv").width() / 2 - W2S(focus).x;
//            var shiftFocusY = $("#canvasDiv").height() / 2 - W2S(focus).y;
//            centerX += shiftFocusX;
//            centerY += shiftFocusY;
//
//            self.drawGrid();
//            self.refreshFinalCanvas();
//            self.drawKeyPoints();
        });

        $(document).on(touchend, '.coordBtn', function () {
            if (showCoord == false) {
                showCoord = true;
                $(this).css("background-color","black");
            }
            else if (showCoord == true) {
                showCoord = false;
                $(this).css("background-color","green");
            }

            self.drawGrid();
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        });

        $(document).on(touchend, '.dataSign', function () {
            var id = $(this).parent().attr("id");
            if (findObject(id).enabled==false) return;
            if ($('.tableDiv[id="tableDiv'+id+'"]').find("tr").length>0){
                self.generateTable();
                if ($('.tableDiv[id="tableDiv'+id+'"]').css("display")!="none"){
                    $(".tableDiv").hide();
                }
                else {
                    $(".tableDiv").hide();
                    $('.tableDiv[id="tableDiv'+$(this).parent().attr("id")+'"]').fadeIn();
                }
            }
        });

        $(document).on(touchend, '.sketchColor', function () {
            sketchColor = $(this).attr("color");
            console.log(sketchColor);
            sketchObj = findObject(sketchColor);
            if (sketchObj.array.length<=2){
                $(".sketchColor").css("background-color","white");
                self.sketchMode = true;
                $(this).css("background-color","#DDDDDD");
            }
        });

        $(document).on("keyup", '.sketchLabel', function () {
            var color = $(this).parent().children().first().attr("color");
            var text = $(this).text();
            objects.forEach(function(obj){
                    if(obj.id==color){
                        obj.label = text;
                    }
                }
            )
        });

        var next=80;
        var last=20;
        $("#canvasDiv").on(touchstart, function(event){
            if (event.type=="touchstart"){
                if (event.originalEvent.touches.length==1){
                    self.startX = event.originalEvent.touches[0].clientX;
                    self.startY = event.originalEvent.touches[0].clientY-harnessOffset;
                }
                else {
                    self.startXA = event.originalEvent.touches[0].clientX;
                    self.startYA = event.originalEvent.touches[0].clientY-harnessOffset;
                    self.startXB = event.originalEvent.touches[1].clientX;
                    self.startYB = event.originalEvent.touches[1].clientY-harnessOffset;
                    self.startScale = scaleWorld;
                }
            }
            else{
                self.startX = event.clientX;
                self.startY = event.clientY-harnessOffset;
            }
            self.startCenterX = centerX;
            self.startCenterY = centerY;
            self.dragging = true;
            if (self.graphMode) {
                self.aimAt(self.startX, self.startY);
                if (sketchObj!=null){
                    sketchPoint = self.selectPoint(self.startX, self.startY, sketchObj);
                }
            }
            else if (self.sketchMode){
                sketchObj.array[0] = S2W({
                    x: self.startX,
                    y: self.startY
                });
            }
        });
        $("#canvasDiv").on(touchmove, function(event){

            if (scaleWorld==40){next=80;last=20;this._intervalIndex=1;}
            else if (scaleWorld==200){next=400; last=80; this._intervalIndex=0;}
            var offsetX = 0;
            var offsetY = 0;
            if (event.type=="touchmove"){
                var focus = S2W({
                    x: $("#canvasDiv").width() / 2,
                    y: $("#canvasDiv").height() / 2
                });
                if (event.originalEvent.touches.length==1){
                    offsetX = event.originalEvent.touches[0].clientX - self.startX;
                    offsetY = event.originalEvent.touches[0].clientY-harnessOffset - self.startY;
                }
                else {
                    var newDis= calDistance(
                        {x: event.originalEvent.touches[0].clientX,y: event.originalEvent.touches[0].clientY-harnessOffset},
                        {x: event.originalEvent.touches[1].clientX,y: event.originalEvent.touches[1].clientY-harnessOffset}
                    );
                    var oldDis= calDistance(
                        {x: self.startXA, y: self.startYA},
                        {x: self.startXB, y: self.startYB}
                    );
                    var scalefactor = newDis/oldDis;

                    scaleWorld=self.startScale*scalefactor;
                    self.gridScale *= scalefactor;
                    self.startXA = event.originalEvent.touches[0].clientX;
                    self.startYA = event.originalEvent.touches[0].clientY-harnessOffset;
                    self.startXB = event.originalEvent.touches[1].clientX;
                    self.startYB = event.originalEvent.touches[1].clientY-harnessOffset;
                    if (next/scaleWorld<1.1||scaleWorld/last<1.1){
                        if (next/scaleWorld<1.1){
                            scaleWorld=next;
                            self.interval=1;
                        }
                        else if (scaleWorld/last<1.1){
                            scaleWorld=last;
                            self.interval=-1;
                        }
                        next = scaleWorld*self.interval;
                        self.interval=-1;
                        last = scaleWorld/self.interval;
                        self.interval=1;
                        self.gridScale = 40;
                    }
                    self.startScale = scaleWorld;
                }
            }
            else { //event.type==mousemove
                offsetX = event.clientX - self.startX;
                offsetY = event.clientY-harnessOffset - self.startY;
            }

            if (!self.dragging&&!self.graphMode){
                return;
            }
            else if (self.sketchMode&&self.dragging){
                var target = self.snap(self.startX+offsetX,self.startY+offsetY);
                self.aimAt(target.x, target.y);
                sketchObj.array[1] = S2W({
                    x: target.x,
                    y: target.y
                });
                self.refreshFinalCanvas();
                self.drawKeyPoints();
            }
            else if(self.dragging&&self.graphMode){
                var target = self.snap(self.startX+offsetX,self.startY+offsetY);
                self.aimAt(target.x, target.y);
                if (sketchPoint!=null){
                    var worldPoint = S2W({x:target.x, y:target.y});
                    sketchPoint.x = worldPoint.x;
                    sketchPoint.y = worldPoint.y;
                    self.refreshFinalCanvas();
                    self.drawKeyPoints();
                }
            }
            else if(self.dragging&&!self.graphMode){
                if (event.type=="touchmove"&&event.originalEvent.touches.length>1){
                    var shiftFocusX = $("#canvasDiv").width() / 2 - W2S(focus).x;
                    var shiftFocusY = $("#canvasDiv").height() / 2 - W2S(focus).y;
                    centerX += shiftFocusX;
                    centerY += shiftFocusY;
                }
                else {
                    centerX = self.startCenterX + offsetX;
                    centerY = self.startCenterY + offsetY;
                }
                self.drawGrid();
                self.refreshFinalCanvas();
                self.drawKeyPoints();
            }
        });
        $("#canvasDiv").on(touchend, function(event){
            self.dragging = false;
            document.getElementById("draftCanvas").width = document.getElementById("draftCanvas").width;
            var offsetX = 0;
            var offsetY = 0;
            if (self.sketchMode){
                self.sketchMode = false;
                sketchObj = null;
                $(".sketchColor").css("background-color","white");
            }
            else if (self.graphMode){
                if (sketchObj!=null) {
                    sketchObj.array.sort(function(a,b){return a.x- b.x});
                    self.refreshFinalCanvas();
                    self.drawKeyPoints();
                    return;
                }
                if (event.type=="touchend"){
                    if (event.originalEvent.changedTouches.length==1){
                        offsetX = event.originalEvent.changedTouches[0].clientX - self.startX;
                        offsetY = event.originalEvent.changedTouches[0].clientY-harnessOffset - self.startY;
                    }
                }
                else { //eventtype==mousemove
                    offsetX = event.clientX - self.startX;
                    offsetY = event.clientY-harnessOffset - self.startY;
                }
                var target = self.snap(self.startX+offsetX,self.startY+offsetY);
                self.graphArray.push(S2W(target));
                var context = document.getElementById("finalCanvas").getContext("2d");
                context.beginPath();
                context.arc(target.x, target.y, 3,0,2*Math.PI,true);
                context.fillStyle = "black";
                context.fill();
            }
        });
        $("#scaleXYOpen").on(touchend, function(){
            if ($(".zoomTools table").css("display")=="none"){
                $(".zoomTools table").show();$(this).css("content",'url("image/SlideOpen.png")');
            }
            else{
                $(".zoomTools table").hide();$(this).css("content",'url("image/SlideClose.png")');
            }
        });
        $("#scaleXY").on("keyup", function(){
            var value = parseFloat($(this).text());
            if (value>0){
                scaleXY =1/value;
                self.refreshFinalCanvas();
                self.drawGrid();
                self.drawKeyPoints();
            }
        });

        this.parseSavedState(initState);
        if (scaleWorld==40){next=80;last=20;this._intervalIndex=1;}
        else if (scaleWorld==200){next=400; last=80; this._intervalIndex=0;}
        this.drawGrid();
    },

    updateGraphTable: function(){
        var id = $("#graphTableDiv").attr("graphid");
        var graph = findObject(id);
        graph.array = new Array();
        $("#graphTable>tbody>tr").each(function(tr){
            var x = replaceAll(String.fromCharCode(8211),'-',$(this).children("td:nth(0)").text());
            var y = replaceAll(String.fromCharCode(8211),'-',$(this).children("td:nth(1)").text());

            if (x.indexOf("/")!=-1)
                x = parseFloat(x.split("/")[0]/x.split("/")[1]);
            if (y.indexOf("/")!=-1)
                y = parseFloat(y.split("/")[0]/y.split("/")[1]);

            if (parseFloat(x)*0==0&&parseFloat(y)*0==0){
                graph.array.push({x:parseFloat(x),y:parseFloat(y)});
            }
        });
        this.refreshFinalCanvas();
    },

    changeScale: function(from, to, focus){
        var t = (to-from)/20;
        var self = this;
        scaleWorld = from+t;
        var transition = setInterval(function(){
            scaleWorld+=t;
            self.gridScale = 40*scaleWorld/from;
            if ($("#labelTable").css("display")=="none"){
                var shiftFocusX = $("#canvasDiv").width() / 2 - W2S(focus).x;
                var shiftFocusY = $("#canvasDiv").height() / 2 - W2S(focus).y;
                centerX += shiftFocusX;
                centerY += shiftFocusY;
            }
            self.drawGrid();
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        },25);
        setTimeout(function(){
            clearInterval(transition);
//            if (to<from) self.interval=-1;
            scaleWorld = to;
            if (to>from) self.interval=1;
            else if (to<from) self.interval=-1;

            self.gridScale = 40;
            if ($("#labelTable").css("display")=="none"){
                var shiftFocusX = $("#canvasDiv").width() / 2 - W2S(focus).x;
                var shiftFocusY = $("#canvasDiv").height() / 2 - W2S(focus).y;
                centerX += shiftFocusX;
                centerY += shiftFocusY;
            }
            self.drawGrid();
            self.refreshFinalCanvas();
            self.drawKeyPoints();
        },500);
    },

    removeLine: function(id){
        objects.forEach(function(line){
            if (line.id==id){
                for (var i = 0; i < intersectPoints.length; i++) {
                    var keyPoint = intersectPoints[i];
                    if (line.id==keyPoint.id1||line.id==keyPoint.id2){
                        intersectPoints.splice(i,1);
                        i--;
                    }
                }
                objects.splice(objects.indexOf(line), 1);
                return line;
            }
        });
    },

    isEnabled: function(id){
        var enabled = false;
        objects.forEach(function(line){
            if (line.id==id) enabled = line.enabled;
        });
        return enabled;
    },

    hideLine: function(id){
        var self = this;
        objects.forEach(function(line){
            if (line.id==id){
                objects[objects.indexOf(line)].enabled = objects[objects.indexOf(line)].enabled?false:true;
                for (var i = 0; i < intersectPoints.length; i++) {
                    var keyPoint = intersectPoints[i];
                    if (line.id==keyPoint.id1||line.id==keyPoint.id2){
                        console.log(keyPoint.id1,self.isEnabled(keyPoint.id1),keyPoint.id2,self.isEnabled(keyPoint.id2));
                        intersectPoints[i].enabled = (self.isEnabled(keyPoint.id1)&&self.isEnabled(keyPoint.id2));
                    }
                }
            }
        });
    },

    drawGrid: function () {
        var gridCanvas = document.getElementById("baselineCanvas");
        var context = gridCanvas.getContext("2d");
        gridCanvas.width = gridCanvas.width;
        context.font = '16px sans-serif';
        var gridScale = this.gridScale;
        for (var x = centerX; x < $("#canvasDiv").width(); x += gridScale) {
            context.moveTo(x, 0);
            context.lineTo(x, $("#canvasDiv").height());
        }
        for (var y = centerY; y < $("#canvasDiv").height(); y += gridScale) {
            context.moveTo(0, y);
            context.lineTo($("#canvasDiv").width(), y);
        }
        for (var x = centerX; x > 0 ; x -= gridScale) {
            context.moveTo(x, 0);
            context.lineTo(x, $("#canvasDiv").height());
        }
        for (var y = centerY; y > 0 ; y -= gridScale) {
            context.moveTo(0, y);
            context.lineTo($("#canvasDiv").width(), y);
        }
        context.lineWidth = 1;
        context.strokeStyle = "#EEEEEE";
        context.stroke();

        context.beginPath();
        context.strokeStyle = "#909090";
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText("0", centerX+5, centerY+5);

        var interval = 10/this.interval*gridScale;
        for (var x = centerX+interval; x < $("#canvasDiv").width(); x += interval) {
            var text = Math.round(S2W({x:x,y:0}).x*1000)/1000; // ->
            context.moveTo(x, 0);
            context.lineTo(x, $("#canvasDiv").height());
            context.textAlign = 'center';
            context.textBaseline = 'top';
            if (centerY<=0) {
                context.fillStyle = '#BBBBBB';
                context.fillText(text , x, 5);
                context.fillStyle = 'black';
            }
            else if (centerY>=$("#canvasDiv").height()-26){
                context.textBaseline = 'bottom';
                context.fillStyle = '#BBBBBB';
                context.fillText(text , x, $("#canvasDiv").height()-5);
                context.fillStyle = 'black';
            }
            else context.fillText(text , x, centerY+5);
        }
        for (var y = centerY+interval; y < $("#canvasDiv").height(); y += interval) {
            var text = Math.round(S2W({x:0,y:y}).y*1000)/1000;  //V
            context.moveTo(0, y);
            context.lineTo($("#canvasDiv").width(), y);
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            if (centerX<=0) {
                context.fillStyle = '#BBBBBB';
                context.fillText(text , 5, y);
                context.fillStyle = 'black';
            }
            else if (centerX>=$("#canvasDiv").width()-26){
                context.textAlign = 'right';
                context.fillStyle = '#BBBBBB';
                context.fillText(text , $("#canvasDiv").width()-5, y);
                context.fillStyle = 'black';
            }
            else context.fillText(text , centerX+5, y);
        }
        for (var x = centerX-interval; x > 0 ; x -= interval) {
            var text = Math.round(S2W({x:x,y:0}).x*1000)/1000;  // <-
            context.moveTo(x, 0);
            context.lineTo(x, $("#canvasDiv").height());
            context.textAlign = 'center';
            context.textBaseline = 'top';
            if (centerY<=0){
                context.fillStyle = '#BBBBBB';
                context.fillText(text , x, 5);
                context.fillStyle = 'black';
            }
            else if (centerY>=$("#canvasDiv").height()-26){
                context.textBaseline = 'bottom';
                context.fillStyle = '#BBBBBB';
                context.fillText(text , x, $("#canvasDiv").height()-5);
                context.fillStyle = 'black';
            }
            else context.fillText(text , x, centerY+5);
        }
        for (var y = centerY-interval; y > 0 ; y -= interval) {
            var text = Math.round(S2W({x:0,y:y}).y*1000)/1000;   //^
            context.moveTo(0, y);
            context.lineTo($("#canvasDiv").width(), y);
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            if (centerX<=0){
                context.fillStyle = '#BBBBBB';
                context.fillText(text , 5, y);
                context.fillStyle = 'black';
            }
            else if (centerX>=$("#canvasDiv").width()-26){
                context.textAlign = 'right';
                context.fillStyle = '#BBBBBB';
                context.fillText(text , $("#canvasDiv").width()-5, y);
                context.fillStyle = 'black';
            }
            else context.fillText(text , centerX+5, y);
        }

        context.stroke();
        context.beginPath();
        context.moveTo(centerX, 0);
        context.lineTo(centerX, $("#canvasDiv").height());
        context.moveTo(0, centerY);
        context.lineTo($("#canvasDiv").width(), centerY);
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.stroke();

        var headerX = centerX-5, headerY = centerY-5;
        if (headerX<($(".headerXY").last().text().length*8+8)) headerX=$(".headerXY").last().text().length*8+8;
        else if (headerX>$("#canvasDiv").width()-5) headerX= $("#canvasDiv").width()-5;
        if (headerY<20) headerY=20;
        else if (headerY>$("#canvasDiv").height()-5) headerY= $("#canvasDiv").height()-5;
        context.textAlign = 'right';
        context.textBaseline = 'top';
        context.fillText($(".headerXY").last().text() , headerX, 5);
        context.textAlign = 'right';
        context.textBaseline = 'bottom';
        context.fillText($(".headerXY").first().text() , $("#canvasDiv").width()-5, headerY);
    },

    plot: function (formula, color) {
        var poly = parseFormula(formula); //    Ax2+Bxy+Cy2+Dx+Ey+F=0
        if (poly=="invalid"){return "invalid"}
        var A = poly.xsq, B = poly.xy, C = poly.ysq,
            D = poly.x, E = poly.y, F = poly.constant;
        if (A == 0 && B == 0 && C == 0) { //line
            var line = new Line({
                // equation: Ax+By+C=0
                id: color,
                type: "ray",
                A: D,
                B: E,
                C: F,
                formula: formula
            });
            line.computeParams();
            if ((line.A+line.B+line.C)*0==0){
                objects.forEach(function (obj) {
                    intersect(line, obj)
                });
                objects.push(line);
            }
            else line = "invalid";
            return line;
        }
        else if (A != 0 && B == 0 && C == 0 && E!=0) { //parabola
            var parabola = new Parabola({
                id: color,
                type: "parabola",
                A:A,B:B,C:C,D:D,E:E,F:F
            });
            if ((parabola.A+parabola.D+parabola.E+parabola.F)*0==0){
                objects.forEach(function (obj) {
                    intersect(parabola, obj)
                });
                objects.push(parabola);
            }
            else parabola = "invalid";
            return parabola;
        }
    },

    refreshFinalCanvas: function () {
        var self = this;
        var finalCanvas = document.getElementById("finalCanvas");
        var context = finalCanvas.getContext("2d");
        finalCanvas.width = finalCanvas.width;
        context.strokeStyle = Colors.obj;
//    context.shadowColor = '#555';
//    context.shadowBlur = 10;
//    context.shadowOffsetX = 5;
//    context.shadowOffsetY = 5;
        context.lineWidth = 2;
        context.strokeStyle = Colors.obj;
        this.graphArray.forEach(function(point){
            context.beginPath();
            context.arc(W2S(point).x, W2S(point).y, 3, 0, 2 * Math.PI, true);
            context.fill();
        });
        objects.forEach(function (selected) {
            if (selected.type == "freehand") {
                context.beginPath();
                for (var i = 0; i < selected.trail.length; i++) {
                    context.lineTo(W2S(selected.trail[i]).x, W2S(selected.trail[i]).y);
                }
                context.stroke();
            }
            if (selected.type == "line") {
                context.beginPath();
                context.moveTo(W2S(selected.start).x, W2S(selected.start).y);
                context.lineTo(W2S(selected.end).x, W2S(selected.end).y);
//                context.lineWidth = 1;
                context.stroke();
            }
            else if (selected.type == "ray") {
                if (selected.enabled==true&&selected.id!="x_axis"&&selected.id!=="y_axis"){
                    selected.show("finalCanvas");
                }
            }
            else if (selected.type == "graph"){
                if (selected.enabled==true){
                    selected.show("bezier", !self.sketchMode);
                }
            }
            else if (selected.type == "parabola"){
                if (selected.enabled==true){
                    selected.show("bezier");
                }
            }
            else if (selected.type == "sketch"){
                if (selected.enabled==true){
                    selected.show("finalCanvas");
                }
            }
            else if (selected.type == "circle") {
                context.beginPath();
                context.arc(W2S(selected.center).x, W2S(selected.center).y, selected.radius * scaleWorld, 0, 2 * Math.PI, true);
//                context.lineWidth = 1;
                context.stroke();
            }
            else if (selected.type == "ellipse") {
                context.ellipse(
                    (W2S(selected.focal1).x + W2S(selected.focal2).x) / 2,
                    (W2S(selected.focal1).y + W2S(selected.focal2).y) / 2,
                    selected.a * scaleWorld, selected.b * scaleWorld, 0, 2, -selected.alpha
                );
            }
            else if (selected.type == "sin") {
                var pointWorld = {x: 0, y: 0};
                var pointScreen = W2S(pointWorld);
                context.beginPath();
                for (pointWorld.x = -centerX / scaleWorld; pointWorld.x < ($(".appWrap").width() - centerX) / scaleWorld; pointWorld.x += scale / 10) {
                    pointWorld.y = -selected.ky * Math.sin((pointWorld.x - selected.dx) * Math.PI / 2 / selected.kx) + selected.dy;
                    pointScreen = W2S(pointWorld);
                    context.lineTo(pointScreen.x, pointScreen.y);
                }
                context.stroke();
            }
            else if (selected.type == "text") {
                context.beginPath();
                context.fillStyle = Colors.obj;
                context.font = 'italic 12px sans-serif';
                context.textAlign = 'left';
                context.textBaseline = 'top';
                context.fillText(selected.content, W2S(selected.position).x, W2S(selected.position).y);
            }
        });
        this.generateTable();
    },

    drawKeyPoints: function () {
        var baselineCanvas = document.getElementById("finalCanvas");
        var context = baselineCanvas.getContext("2d");
        intersectPoints.forEach(function (point) {
            if (!point.enabled) return;
            var pointScreen = W2S(point);
            context.beginPath();
            context.fillStyle = "ff0000";
            context.strokeStyle = "ff0000";
            context.arc(pointScreen.x, pointScreen.y, 2, 0, 2 * Math.PI, true);
            context.fill();
            context.stroke();
            if (showCoord == true) {
                var coord = parseCoordinate(point.x, point.y);
                context.font = '12px sans-serif';
                context.textAlign = 'left';
                context.textBaseline = 'top';
                context.fillText(coord, pointScreen.x, pointScreen.y);
            }
        });

//        context.beginPath();
//        context.fillStyle = "eeee00";
//        context.strokeStyle = "eeee00";
//        context.arc( $("#canvasDiv").width() / 2, $("#canvasDiv").height() / 2, 2, 0, 2 * Math.PI, true);
//        context.fill();
//        context.stroke();
    },

    generateTable: function () {
        $(".tableDiv table").html("");
        var rightbottom = S2W({
            x:$("#canvasDiv").width(),
            y:$("#canvasDiv").height()
        });
        var lefttop = S2W({x:0,y:0});
        var interval = 40/scaleWorld*5/this.interval;
        var table = new Array();
        objects.forEach(function(line){
            if (line.id[0]!="#") return;
            var tr = '<tr><th>x</th><th>y</th></tr>';
            var start = Math.ceil(lefttop.x/interval)*interval;
            for (var i=start; i<=rightbottom.x; i+=interval){
                var j=0;
                if (line.type=="ray") j = -(line.C +line.A*i)/line.B;
                else if (line.type=="parabola") j=-(line.A*i*i+line.D*i+line.F)/line.E
                var i_display = Math.round(i*1000)/1000;
                var j_display = Math.round(j*1000)/1000;
                i_display = i<0?String.fromCharCode(8211)+-i_display:i_display;
                j_display = j<0?String.fromCharCode(8211)+-j_display:j_display;
                tr += '<tr style="color:'+line.color+'"><td>'+i_display+'</td><td>'+j_display+'</td></tr>';
            }
            $('.tableDiv[id="tableDiv'+line.id +'"] table').append(tr);
        });
    },

    parseSavedState: function(states){
        var self = this;
        var isIOS = ((/iphone|ipad/gi).test(navigator.appVersion));
        var touchend = isIOS ? "touchend" : "mouseup";
        states.forEach(function(state){
            if (state.type=="config"){
                centerX=state.centerX;
                centerY=state.centerY;
                scaleWorld=state.scaleWorld;
                scaleXY = state.scaleXY;
                $("#graphTable thead th:nth(0)").html(state.headerX);
                $("#graphTable thead th:nth(1)").html(state.headerY);
                $("#scaleXY").html(1/state.scaleXY);
            }
            else if (state.type=="ray"){
                $(".addItem").trigger(touchend);
                var str = replaceAll("x","<i>X</i>",state.formula);
                str = replaceAll("y","<i>Y</i>",str);
                str = replaceAll("X","x",str);
                str = replaceAll("Y","y",str);
                $(".controlRow").last().find("span.input").html(str);
                $(".controlRow").last().find(".enter_key").trigger(touchend);
                objects[objects.length-1].label = state.label;
                $("#labelTable .sketchLabel").last().html(state.label);
            }
            else if (state.type=="graph"){
                $(".addTable").trigger(touchend);
                objects[objects.length-1].array = state.array;
                objects[objects.length-1].label = state.label;
                $("#labelTable .sketchLabel").last().html(state.label);
            }
        });
        $(".keyboardContainer").hide();
//        $(".slideClose").trigger(touchend);
    },

    snap: function(targetX,targetY){
        var interval = this.gridScale;
        var fractionX = (Math.round((targetX-centerX)/interval)*interval)-(targetX-centerX);
        var fractionY = (Math.round((targetY-centerY)/interval)*interval)-(targetY-centerY);
        if (Math.abs(fractionX)<=4){ targetX +=fractionX; }
        if (Math.abs(fractionY)<=4){ targetY +=fractionY; }
        return {x:targetX,y:targetY};
    },

    aimAt: function(targetX, targetY){
        var context = document.getElementById("draftCanvas").getContext("2d");
        document.getElementById("draftCanvas").width = document.getElementById("draftCanvas").width;
        context.beginPath();
        context.moveTo(targetX+5, targetY);                context.lineTo(targetX+20, targetY);
        context.moveTo(targetX-5, targetY);                context.lineTo(targetX-20, targetY);
        context.moveTo(targetX, targetY+5);                context.lineTo(targetX, targetY+20);
        context.moveTo(targetX, targetY-5);                context.lineTo(targetX, targetY-20);
        context.strokeStyle = "green";
        context.lineWidth = 2;
        context.stroke();
        var x=S2W({x:targetX,y:targetY}).x;
        x = Math.round(x*100)/100;
        x = x<0?String.fromCharCode(8211)+-x:x;
        var y=S2W({x:targetX,y:targetY}).y;
        y = Math.round(y*100)/100;
        y = y<0?String.fromCharCode(8211)+-y:y;
        context.font = '24px sans-serif';
        context.textBaseline = 'bottom';
        context.fillStyle = "green";
        context.textAlign = 'right';
        context.fillText(x , targetX-60, targetY-10);
        context.textAlign = 'center';
        context.fillText("," , targetX-55, targetY-10);
        context.textAlign = 'left';
        context.fillText(y , targetX-50, targetY-10);
    },

    selectPoint: function(x,y,obj){
//        var worldPoint = S2W({x:x,y:y});
        var nearest = 20;
        var target = null;
        obj.array.forEach(function(point){
            var dis = calDistance(W2S(point),{x:x,y:y});
            if (dis<nearest){
                target=point;
                nearest = dis;
            }
        });
        return target;
    }
};

addIntersectPoint = function (point, id1, id2) {
    intersectPoints.push({
        x: point.x,
        y: point.y,
        id1: id1,
        id2: id2,
        enabled: true
    });
    console.log("adding " + id1 + " , " + id2);
};

addObject = function (newObject) {
    objects.splice(newObject.id, 0, newObject);
};

parseCoordinate = function(x,y){
    var coordX = Math.round(x * 100) / 100;
    var coordY = Math.round(y * 100) / 100;
    if (coordX<0) coordX = String.fromCharCode(8211)+coordX*-1;
    if (coordY<0) coordY = String.fromCharCode(8211)+coordY*-1;
    return '('+coordX+','+coordY+')';
};

findObject = function(id){
    var object=null;
    objects.forEach(function(obj){
        if (obj.id==id){
            object = obj;
        }
    });
    return object;
};