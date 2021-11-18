//Nhut Ly - CS 559 - Fall 2021

function setup() {
    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
    var time = 0; //time parameter for the curve function

    // some variables that will be updated for the animation
    var pos1x = -3;
    var pos1y = -3;
    var pos2x = -3;
    var pos2y = -3;
    var reachMax = false;
    var scale = 1;
    var ang = .1;
    var size = 100;
    var yAir1 = 400;

    function draw() {
        canvas.width = canvas.width;

        // fill background
        context.fillStyle = "rgba(0,0,0,.8)";
        context.rect(0, 0, canvas.width, canvas.height);
        context.fill();

        function moveToTx(loc, Tx) {
            var res = vec2.create();
            vec2.transformMat3(res, loc, Tx);
            context.moveTo(res[0], res[1]);
        }

        function lineToTx(loc, Tx) {
            var res = vec2.create();
            vec2.transformMat3(res, loc, Tx);
            context.lineTo(res[0], res[1]);
        }

        function drawPoint(color, loc, Tx) {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 5;
            var res = vec2.create();
            vec2.transformMat3(res, loc, Tx);
            context.moveTo(res[0], res[1]);
            context.lineTo(res[0] + 1, res[1] + 1);
            context.stroke();
            context.lineWidth = 1;
        }

        // draw an arc given location, radius, and T transformation matrix
        function arcTx(loc, r, Tx) {
            var res = vec2.create();
            vec2.transformMat3(res, loc, Tx);
            context.arc(x = res[0], y = res[1], radius = r * scale, sAngle = 0, eAngle = 2 * Math.PI);
        }

        // draw axes to better understanding the current coordinates
        function drawAxes(color, Tx) {
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 3;
            // Axes
            moveToTx([120, 0], Tx);
            lineToTx([0, 0], Tx);
            lineToTx([0, 120], Tx);
            // Arrowheads
            moveToTx([110, 5], Tx);
            lineToTx([120, 0], Tx);
            lineToTx([110, -5], Tx);
            moveToTx([5, 110], Tx);
            lineToTx([0, 120], Tx);
            lineToTx([-5, 110], Tx);
            // X-label
            moveToTx([130, 0], Tx);
            lineToTx([140, 10], Tx);
            moveToTx([130, 10], Tx);
            lineToTx([140, 0], Tx);
            // Y-label
            moveToTx([0, 130], Tx);
            lineToTx([5, 135], Tx);
            lineToTx([10, 130], Tx);
            moveToTx([5, 135], Tx);
            lineToTx([5, 142], Tx);
            context.stroke();
            context.lineWidth = 1;
        }

        // draw a circle with given parameters
        function drawCircle(colorFilled, colorStroke, r, Tx) {
            context.beginPath();
            context.fillStyle = colorFilled;
            context.strokeStyle = colorStroke;
            arcTx([x = 0, y = 0], radius = r, Tx);
            context.fill();
            context.stroke();
        }

        // constructing the line that changes its length based the variable time t
        var Rstart = 50.0;
        var Rslope = 30.0;
        var Rangle;
        var Cspiral = function(t) {
            Rangle = ang * Math.PI * t;
            var R = Rslope * t + Rstart;
            var x = R * Math.cos(Rangle);
            var y = R * Math.sin(Rangle);
            return [x, y];
        }

        // building basis function b(u) = u*B Hermite
        // using the basis from lecture as a base
        var Hermite = function(t) {
            return [
                2 * t * t * t - 3 * t * t + 1,
                t * t * t - 2 * t * t + t, -2 * t * t * t + 3 * t * t,
                t * t * t - t * t
            ];
        }

        // building derivative of Hermite
        var HermiteDerivative = function(t) {
            return [
                6 * t * t - 6 * t,
                3 * t * t - 4 * t + 1, -6 * t * t + 6 * t,
                3 * t * t - 2 * t
            ];
        }

        // calculating b(u)*P{
        function Cubic(basis, P, t) {
            var b = basis(t);
            var result = vec2.create();
            vec2.scale(result, P[0], b[0]);
            vec2.scaleAndAdd(result, result, P[1], b[1]);
            vec2.scaleAndAdd(result, result, P[2], b[2]);
            vec2.scaleAndAdd(result, result, P[3], b[3]);
            return result;
        }

        // Building a composite curve over the parameter interval [0,2]
        // trick: using variable u that makes the parameter 0<t<1
        var Ccomp = function(t) {
            if (t < 1) {
                var u = t;
                return C0(u);
            } else {
                var u = t - 1.0;
                return C1(u);
            }
        }

        // Building a composite cruve based on the derivative
        var Ccomp_tangent = function(t) {
            if (t < 1) {
                var u = t;
                return C0prime(u);
            } else {
                var u = t - 1.0;
                return C1prime(u);
            }
        }

        // Drawing trajectory for the piece-wise defined curve
        function drawTrajectory(t_begin, t_end, intervals, C, Tx, color) {
            context.strokeStyle = color;
            context.beginPath();
            moveToTx(C(t_begin), Tx);
            for (var i = 1; i <= intervals; i++) {
                var t = ((intervals - i) / intervals) * t_begin + (i / intervals) * t_end;
                lineToTx(C(t), Tx);
            }
            context.stroke();
            context.closePath();
        }

        // Draw object that will be traversed along the piece-wise defined curve
        function drawObject(color1, color2, Tx) {
            drawTrajectory(0.0, 1.0, 100, C0, Tx, color1);
            drawTrajectory(0.0, 1.0, 100, C1, Tx, color2);
        }

        // draw blue fan
        Rstart = 50.0;
        Rslope = 30.0;
        var Torange_to_canvas = mat3.create();
        mat3.fromTranslation(Torange_to_canvas, [200, 200]);
        mat3.rotate(Torange_to_canvas, Torange_to_canvas, Math.PI);
        drawTrajectory(0.0, 2.0, 1000, Cspiral, Torange_to_canvas, "lightblue");
        ang = ang + .1;
        size = (size + 1) % 500;
        Rstart = 5.0;
        Rslope = 3.0;
        yAir1 = (yAir1 - 2);
        if (yAir1 == -60) {
            yAir1 = 600;
        }

        //draw sun
        Rstart = 25.0;
        Rslope = 15.0;
        var Tsun_to_canvas = mat3.create();
        mat3.fromTranslation(Tsun_to_canvas, [900, 70]);
        drawCircle("yellow", "orange", radius = 30, Tsun_to_canvas);
        drawTrajectory(0.0, 1.5, 100, Cspiral, Tsun_to_canvas, "yellow");

        /************************* Drawing Nike Swoosh ************************/
        // defining control points for Nike Swoosh
        var p0 = [0, 0];
        var d0 = [-1, -3];
        var p1 = [1, .5];
        var d1 = [1, 1.75];
        var p2 = [0, 0];
        var d2 = [0, 2.5];

        var P0 = [p0, d0, p1, d1]; //   First two points and tangents
        var P1 = [p1, d1, p2, d2]; //   Last two points and tangents

        // Defining two curves C0(t) and C1(t)
        // both of these curves assume a parameter takes value range [0,1]
        var C0 = function(t_) { return Cubic(Hermite, P0, t_); };
        var C1 = function(t_) { return Cubic(Hermite, P1, t_); };

        var C0prime = function(t_) { return Cubic(HermiteDerivative, P0, t_) };
        var C1prime = function(t_) { return Cubic(HermiteDerivative, P1, t_) };

        var Tblue_to_canvas = mat3.create();
        mat3.fromTranslation(Tblue_to_canvas, [500, 350]);
        mat3.scale(Tblue_to_canvas, Tblue_to_canvas, [100, -100]); // Flip the Y-axis
        mat3.rotate(Tblue_to_canvas, Tblue_to_canvas, -Math.PI / 6);

        context.lineWidth = 3;
        drawTrajectory(0.0, 1.0, 100, C0, Tblue_to_canvas, "red");
        drawTrajectory(0.0, 1.0, 100, C1, Tblue_to_canvas, "beige");
        /*********************************************************************/

        /************************* Drawing Shoe Frame ************************/
        // defining control points for Shoe Frame
        var p3 = [0, 0]; //green start
        var d3 = [-1, -3];
        var d3c = [pos2x, pos2y];

        var p4 = [-3, -1.5]; //orange start
        var d4 = [-1, -2];

        var p5 = [1, -1.75]; //purple start
        var d5 = [1, .75];

        var p6 = [1, -.5]; //red start
        var d6 = [-1, 0];

        var p7 = [.05, -.25]; //black start
        var d7 = [.25, 1];

        var p8 = [0, 0]; //black end
        var d8 = [0, 0];

        var p9 = [1, -1.75]; //darkblue end
        var d9 = [0, -1];

        var p10 = [-2 + pos1x / 15, 0 + pos1x / 10]; //end brown shoelace
        var d10 = [pos1x, pos1y];

        var p11 = [-1.5, pos1y / 10]; //end maroon shoelace
        var d11 = [pos1x / 2, -pos1y / 2];

        var P2 = [p3, d3, p4, d4]; //green curve
        var P3 = [p4, d4, p5, d5]; //orange curve
        var P4 = [p5, d5, p6, d6]; //purple curve
        var P5 = [p6, d6, p7, d7]; //red curve
        var P6 = [p7, d7, p8, d8]; //black curve
        var P7 = [p4, d4, p9, d9]; //darkblue cuve
        var P8 = [p3, d3c, p10, d10]; //brown curve
        var P9 = [p3, d3c, p11, d11]; //maroon curve

        var C2 = function(t_) { return Cubic(Hermite, P2, t_); };
        var C3 = function(t_) { return Cubic(Hermite, P3, t_); };
        var C4 = function(t_) { return Cubic(Hermite, P4, t_); };
        var C5 = function(t_) { return Cubic(Hermite, P5, t_); };
        var C6 = function(t_) { return Cubic(Hermite, P6, t_); };
        var C7 = function(t_) { return Cubic(Hermite, P7, t_); };
        var C8 = function(t_) { return Cubic(Hermite, P8, t_); };
        var C9 = function(t_) { return Cubic(Hermite, P9, t_); };

        var Tgreen_to_blue = mat3.create();
        mat3.fromTranslation(Tgreen_to_blue, [.10, 1]);
        mat3.rotate(Tgreen_to_blue, Tgreen_to_blue, Math.PI / 6);
        var Tgreen_to_canvas = mat3.create();
        mat3.multiply(Tgreen_to_canvas, Tblue_to_canvas, Tgreen_to_blue);

        context.lineWidth = 5;
        drawTrajectory(0.0, 1.0, 100, C2, Tgreen_to_canvas, "green");
        context.lineWidth = 6;
        drawTrajectory(0.0, 1.0, 100, C3, Tgreen_to_canvas, "orange");
        context.lineWidth = 5;
        drawTrajectory(0.0, 1.0, 100, C4, Tgreen_to_canvas, "purple");
        drawTrajectory(0.0, 1.0, 100, C5, Tgreen_to_canvas, "red");
        drawTrajectory(0.0, 1.0, 100, C6, Tgreen_to_canvas, "white");
        drawTrajectory(0.0, 1.0, 100, C7, Tgreen_to_canvas, "rgba(165,107,70)");
        drawTrajectory(0.0, 1.0, 100, C8, Tgreen_to_canvas, "brown");
        drawTrajectory(0.0, 1.0, 100, C9, Tgreen_to_canvas, "maroon");
        /*********************************************************************/

        // drawing object traversing along the trajectory and changing its orientation
        var Tobject_to_blue = mat3.create();
        mat3.fromTranslation(Tobject_to_blue, Ccomp(time));
        var Tobject_to_canvas = mat3.create();
        var tangent = Ccomp_tangent(time);
        var angle = Math.atan2(tangent[1], tangent[0]);
        mat3.rotate(Tobject_to_blue, Tobject_to_blue, angle);
        mat3.multiply(Tobject_to_canvas, Tblue_to_canvas, Tobject_to_blue);
        mat3.scale(Tobject_to_canvas, Tobject_to_canvas, [.25, .25]);

        context.lineWidth = 2;
        drawObject("yellow", "white", Tobject_to_canvas);

        // updating variable for animation
        time = (time + 0.02) % 2;
        if (reachMax == false) {
            pos1x = pos1x + 0.05;
            pos1y = pos1y + 0.05;
            pos2x = pos2x + 0.025;
            pos2y = pos2y + 0.025;
        }
        if (pos1x >= 2 || reachMax == true) {
            reachMax = true;
            pos1x = pos1x - 0.05;
            pos1y = pos1y - 0.05;
            pos2x = pos2x - 0.025;
            pos2y = pos2y - 0.025;
        }
        if (pos1x <= -3) {
            reachMax = false;
        }
        window.requestAnimationFrame(draw);
    }
    draw();
}
window.onload = setup;