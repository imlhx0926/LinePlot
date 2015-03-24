Graph = function(config){
    this.type = config.type;
    this.id = config.id;
    this.enabled = true;
    this.array = config.array;
    this.array.sort(function(a,b){return a.x- b.x});
    this.color = this.id;
    this.sf = config.sf;
    this.connected = true;
    this.label = config.label==undefined?"":config.label;
};

Graph.prototype = {
    show: function(method, sorted){
        var array = this.array;
        if (sorted) this.array.sort(function(a,b){return a.x- b.x});
        var sf = this.sf;
        if (array.length==0){
//            array.push({x:-10,y:0});
//            for (var i=1; i<21;i++){
//                array.push({
//                    x:-10+i,
//                    y:Math.random()*10-5
//                });
//            }
            return;
        }
        var canvasId = "finalCanvas";
        var canvas = document.getElementById(canvasId);
        var context = canvas.getContext("2d");
        var controlPoints = new Array();
        context.strokeStyle = this.color;

        context.beginPath();
        for (var i=0; i< array.length; i++){
            context.moveTo(W2S(array[i]).x, W2S(array[i]).y);
            context.arc(W2S(array[i]).x, W2S(array[i]).y,3,0,2*Math.PI,true);
            context.fillStyle = context.strokeStyle;
            context.fill();
            if (showCoord == true) {
                var coord = parseCoordinate(array[i].x, array[i].y);
                var f= 0, d=0;
                if (i==0) {
                    context.textAlign = 'right';
                    context.textBaseline = (array[1].y-array[0].y<0)?'bottom':'top';
                }
                else if(i==array.length-1){
                    context.textAlign = 'left';
                    context.textBaseline = (array[i-1].y-array[i].y<0)?'bottom':'top';
                }
                else {
                    f = (array[i-1].x-array[i].x)*(array[i+1].y-array[i].y)-(array[i+1].x-array[i].x)*(array[i-1].y-array[i].y)
                    d = array[i+1].y-array[i-1].y;
                    context.textAlign = (d*f>0)?'right':'left';
                    context.textBaseline = (f>0)?'bottom':'top';
                }
                context.font = '12px sans-serif';
                context.fillText(coord, W2S(array[i]).x, W2S(array[i]).y);
            }
        }

        context.lineWidth = 2;
        context.beginPath();
        if (array.length==1){
            // do nothing
        }
        else if (array.length==2){
            context.moveTo(W2S(array[0]).x, W2S(array[0]).y);
            context.lineTo(W2S(array[1]).x, W2S(array[1]).y);
            context.stroke();
        }
        else if (method=="bezier"&&this.connected==true){
// first segment
            context.moveTo(W2S(array[0]).x, W2S(array[0]).y);
            var mid2 = {x:(array[0].x+array[1].x)/2, y:(array[0].y+array[1].y)/2};
            var mid3 = {x:(array[1].x+array[2].x)/2, y:(array[1].y+array[2].y)/2};
            var B2 = lerp(mid2,mid3,calDistance(array[0],array[1])/(calDistance(array[0],array[1])+calDistance(array[1],array[2])));
            var C2 = W2S({
                x: array[1].x + (mid2.x - B2.x)*sf,
                y: array[1].y + (mid2.y - B2.y)*sf
            });
            context.quadraticCurveTo(C2.x, C2.y, W2S(array[1]).x, W2S(array[1]).y);
// intermediate segments
            for (var i=1; i<array.length-2; i++){
                context.moveTo(W2S(array[i]).x, W2S(array[i]).y);
                var mid1 = {x:(array[i-1].x+array[i].x)/2, y:(array[i-1].y+array[i].y)/2};
                var mid2 = {x:(array[i].x+array[i+1].x)/2, y:(array[i].y+array[i+1].y)/2};
                var mid3 = {x:(array[i+1].x+array[i+2].x)/2, y:(array[i+1].y+array[i+2].y)/2};

                var B1 = lerp(mid1,mid2,calDistance(array[i-1],array[i])/(calDistance(array[i-1],array[i])+calDistance(array[i],array[i+1])));
                var B2 = lerp(mid2,mid3,calDistance(array[i],array[i+1])/(calDistance(array[i],array[i+1])+calDistance(array[i+1],array[i+2])));

                var C1 = W2S({
                    x: array[i].x + (mid2.x - B1.x)*sf,
                    y: array[i].y + (mid2.y - B1.y)*sf
                });
                var C2 = W2S({
                    x: array[i+1].x + (mid2.x - B2.x)*sf,
                    y: array[i+1].y + (mid2.y - B2.y)*sf
                });

                context.bezierCurveTo(C1.x, C1.y, C2.x, C2.y, W2S(array[i+1]).x, W2S(array[i+1]).y);

                controlPoints.push(C1);
                controlPoints.push(C2);
            }
// last segment
            context.moveTo(W2S(array[i]).x, W2S(array[i]).y);
            var mid1 = {x:(array[i-1].x+array[i].x)/2, y:(array[i-1].y+array[i].y)/2};
            var mid2 = {x:(array[i].x+array[i+1].x)/2, y:(array[i].y+array[i+1].y)/2};
            var B1 = lerp(mid1,mid2,calDistance(array[i-1],array[i])/(calDistance(array[i-1],array[i])+calDistance(array[i],array[i+1])));
            var C1 = W2S({
                x: array[i].x + (mid2.x - B1.x)*sf,
                y: array[i].y + (mid2.y - B1.y)*sf
            });
            context.quadraticCurveTo(C1.x, C1.y, W2S(array[i+1]).x, W2S(array[i+1]).y);
// stroke
            context.stroke();

            context.beginPath();
            for (var i=0; i< controlPoints.length; i++){
//                console.log(controlPoints[i]);
                context.moveTo(controlPoints[i].x, controlPoints[i].y);
                context.arc(controlPoints[i].x, controlPoints[i].y,3,0,2*Math.PI,true);
                context.fillStyle = 'red';
                context.fill();
            }
        }
    }
};