Parabola = function(config){
    this.type = config.type;
    this.A = config.A;
    this.B = config.B;
    this.C = config.C;
    this.D = config.D;
    this.E = config.E;
    this.F = config.F;
    this.id = config.id;
    this.enabled = true;
    this.start = {};
    this.end = {};
    this.color = this.id;
}

Parabola.prototype = {
    show: function(){
        var c = -this.E/(4*this.A), a = -this.D/(2*this.A), b = (this.D*this.D)/(4*this.A*this.E)-(this.F/this.E);
//        var focus = {x:a, y:b+c};
        var rightbottom = S2W({
            x:$("#canvasDiv").width(),
            y:$("#canvasDiv").height()
        });
        var lefttop = S2W({x:0,y:0});
        var interval = (rightbottom.x-lefttop.x)/10;
        var root_y = (this.A*this.E)<0?lefttop.y:rightbottom.y;
        var delta = Math.sqrt(this.D*this.D-4*this.A*(this.F+this.E*root_y))/(2*this.A);
        var root_left = {
            x: -this.D/(2*this.A)+delta,
            y: root_y
        };
        var root_right = {
            x: -this.D/(2*this.A)-delta,
            y: root_y
        }
        var ctrl_right = {
            x: -this.D/(2*this.A)-delta,
            y: b-c
        }
//        var ctrlPoint = lerp(root_right, midpoint(focus,ctrl_right),2);
        var ctrlPoint = {
            x: a,
            y: 2*b-root_y
        }

        var canvasId = "finalCanvas";
        var canvas = document.getElementById(canvasId);
        var context = canvas.getContext("2d");
        context.strokeStyle = this.color;

        if (showCoord == true) {
            var apex = {x:a,y:b};
            context.beginPath();
            context.moveTo(W2S(apex).x, W2S(apex).y);
            context.arc(W2S(apex).x, W2S(apex).y,3,0,2*Math.PI,true);
            context.fillStyle = context.strokeStyle;
            context.fill();
            var coord = parseCoordinate(Math.round(apex.x * 100) / 100 , Math.round(apex.y * 100) / 100);
            context.font = '12px sans-serif';
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(coord, W2S(apex).x, W2S(apex).y);
        }

        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(W2S(root_right).x, W2S(root_right).y);
        context.quadraticCurveTo(W2S(ctrlPoint).x, W2S(ctrlPoint).y, W2S(root_left).x, W2S(root_left).y);
        context.stroke();
    }
};

