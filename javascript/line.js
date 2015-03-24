Line = function(config){
    this.type = config.type;
    if (config.A<=0&&config.B<=0){
        this.A = config.A==0 ? 0 : -config.A; // +0 and -0 are handled differently as float
        this.B = config.B==0 ? 0 : -config.B;
        this.C = config.C==0 ? 0 : -config.C;
    }
    else {
        this.A = config.A;
        this.B = config.B;
        this.C = config.C;
    }
    this.id = config.id;
    this.enabled = true;
    this.start = {};
    this.end = {};
    this.color = this.id;
    this.label = config.label==undefined?"":config.label;
    this.formula = config.formula==undefined?"":config.formula;
};

Line.prototype = {
    show: function(canvasId){
        var canvas = document.getElementById(canvasId);
        var context = canvas.getContext("2d");
//        canvas.width = canvas.width;
        this.computeParams();
        context.strokeStyle = this.color;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(W2S(this.start).x, W2S(this.start).y);
        context.lineTo(W2S(this.end).x, W2S(this.end).y);
        context.stroke();
    },
    computeParams: function(){
        var rightbottom = S2W({
            x:$("#canvasDiv").width(),
            y:$("#canvasDiv").height()
        });
        var lefttop = S2W({x:0,y:0});
        var D = this.A, E = this.B, F = this.C;
        var start_hori={
            x: lefttop.x,
            y: (-F-lefttop.x*D)/E
        }
        var end_hori={
            x: rightbottom.x,
            y: (-F-rightbottom.x*D)/E
        }
        var start_vert={
            x: (-F-lefttop.y*E)/D,
            y: lefttop.y
        }
        var end_vert={
            x: (-F-rightbottom.y*E)/D,
            y: rightbottom.y
        }

        var start = start_vert.x>start_hori.x ? (start_vert):(start_hori),
            end = end_vert.x<end_hori.x ? (end_vert):(end_hori);

        this.start = start;
        this.end = end;
    }
};