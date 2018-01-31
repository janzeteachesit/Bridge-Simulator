var joints=[],anchors=[], edges = [];
var list=[];
var branch;
var count;
var element;
var held;
var joints_matrix;
var final_forces = [],reaction_forces=[];
var vertex_id;
var squash_link = {}, tension_link = {}, buckling_link = {};
var count = {joint: 0, anchor: 0};
var offsetX, offsetY;
var edge_count = {'beam':0,'load':0,'reaction':0};

//Create a node object
function node(id,edges,type,pos){
    this.pos = pos;
    this.edges = edges;
    this.type = type;
    this.id = id;
}

//Edge object
function edge(id,nodes,type,angle,force){
    this.id =id;
    this.nodes = nodes;
    this.type = type;
    if(type == "reaction" || type == "load"){
        this.angle = angle;
    }
    if(type == "load"){
        this.force = force;
    }
}

//Check if edge exists between two nodes
function edge_exists(node1,node2){
    var node1_edges = node1.edges;
    var exists=false;
    for(var i =0; i<node1_edges.length; i++){
        switch(node1.id){
            case node1_edges[i].nodes[0].id: exists = (node1_edges[i].nodes[1]==node2.id); break;
            case node1_edges[i].nodes[1].id: exists = (node1_edges[i].nodes[0]==node2.id); break;
        }
        if(exists){
            return true;
        }
    }
    return false;
}

//Finds the object associated with the id
function id_to_object(id,array){
    for(var i=0; i<array.length; i++){
        if(array[i].id == id){
            return array[i];
        }
    }
}

//Finds an index
function id_to_index(id,array){
    for(var i=0; i<array.length; i++){
        if(array[i].id == id){
            return i;
        }
    }
}
//Finds the angle of ascent given 2 points
function find_vec_angle(points){return Math.atan2(points[1].pos[1] - points[0].pos[1],points[1].pos[0] - points[0].pos[0]);}        
//Remove information about weak members
function remove_weak(edge_id){
        if(buckling_link.id==squash_link.id && edge_id==buckling_link.id){
            buckling_link = {}; squash_link = {};
        }
        switch(edge_id){
            case buckling_link.id: buckling_link = {}; break;
            case tension_link.id: tension_link = {}; break;
            case squash_link.id: squash_link = {}; break;
        }
}

//Find the length of a vector
function norm(vec){
    var sqsum = 0;
    for(var i=0; i<vec.length; i++){
        sqsum+=vec[i]*vec[i];
    }
    return Math.sqrt(sqsum);
}

//Find the projection of vector 1 along vector 2
function projection(vec1, vec2){
    return s_mult([vec1],multiply([vec1],transpose([vec2]))[0][0]/Math.pow(norm(vec1),2));
}

//Transpose a matrix
function transpose(mat){
    var mat_t = new Array(mat[0].length);
    for(var i=0; i<mat[0].length; i++){
        mat_t[i]=[];
        for(var j=0; j<mat.length; j++){
            mat_t[i].push(mat[j][i]);
        }
    }
    return mat_t;
}

//Add two matricies
function add(mat1,mat2){
    mat3=new Array(mat1.length);
    for(var j=0; j<mat1.length; j++){
        mat3[j]=new Array(mat1[0].length);
        for(var k=0; k<mat1[0].length; k++){
            mat3[j][k]=mat1[j][k]+mat2[j][k];
        }
    }
    return mat3;
}

//Multiply a matrix by a constant
function s_mult(mat,n){
    nmat=new Array(mat.length);
    for(var j=0; j<mat.length; j++){
        nmat[j]=new Array(mat[0].length);
        for(var k=0; k<mat[0].length; k++){
            nmat[j][k]=n*mat[j][k];
        }
    }
    return nmat;
}

//Divide a matrix by a constant
function s_div(mat,n){
    nmat=new Array(mat.length);
    for(var j=0; j<mat.length; j++){
        nmat[j]=new Array(mat[0].length);
        for(var k=0; k<mat[0].length; k++){
            nmat[j][k]=mat[j][k]/n;
        }
    }
    return nmat;
}

//Multiply two matricies
function multiply(mat1, mat2){
    mat3=new Array(mat1.length);
    for(var j=0; j<mat1.length; j++){
        mat3[j]=new Array(mat2.length);
        for(var k=0; k<mat1.length; k++){
            mat3[j][k]=0;
            for(var l=0; l<mat2.length; l++){mat3[j][k]+=mat1[j][l]*mat2[l][k];}
        }
    }
    return mat3;
}

//Find the Q matrix in QR decomposition
function find_q(mat){
    var q_mat = new Array(mat.length);
    var u = new Array(mat.length);
    var t_mat = transpose(mat);
    for(var i=0; i<mat[0].length; i++){
        u[i] = t_mat[i];
        for(var j=i-1; j>=0; j--){
            u[i] = add([u[i]],s_mult(projection(u[j],u[i]),-1))[0];
        }
        u[i] = s_div([u[i]],norm(u[i]))[0];
    }
    q_mat = transpose(u);
    return q_mat;
}

//Solve the matrix equation using QR decomposition
function solve_by_qr_decomp(matrix,vector){
    var q = find_q(matrix);
    var r = multiply(transpose(q),matrix);
    return solve_ru_matrix(r,transpose(multiply(transpose(q),transpose([vector])))[0]);
}

//Part of QR decomposition
function solve_ru_matrix(matrix,vector){
    var solution_set = zeros(matrix.length);
    var l = solution_set.length; var sol;
    for(var j=l-1; j>=0; j--){
        sol=vector[j];
        for(var i=j; i<l; i++){sol-=matrix[j][i]*solution_set[i];}
        solution_set[j] = sol/matrix[j][j];
    }
    return solution_set;
}

//Get relevant forces
function get_forces_of_type(type,array){
    var forces = [];
    for(var i=0; i<array.length; i++){
        if(array[i].type==type){
            forces.push(array[i]);
        }
    }
    return forces;
}

//Create an array with zeros
function zeros(num){
    var arr = [];
    for(var i=0; i<num; i++){
        arr.push(0);
    }
    return arr;
}

//Sum of load forces acting on a joint
function sum_of_loads(joint){
    var loads = get_forces_of_type('load',joint.edges);
    var lFx = 0, lFy=0;
    for(var i=0; i<loads.length; i++){
        lFx+=Math.cos(loads[i].angle)*loads[i].force;
        lFy+=Math.sin(loads[i].angle)*loads[i].force;
    }
    return [lFx, lFy]
}

//Finds the equations needed to simulate the bridge
function sum_of_forces(joint){
    var beams = get_forces_of_type('beam',edges);
    var reactions = get_forces_of_type('reaction',edges);
    var unkns = [].concat(beams,reactions);
    var rows = new Array(2);
    rows[0]=[];
    rows[1]=[];
    for(var i=0; i<unkns.length; i++){
        if(unkns[i].nodes.indexOf(joint)!=-1){
            if(unkns[i].type=='reaction'){
                rows[0].push(Math.cos(unkns[i].angle));
                rows[1].push(Math.sin(unkns[i].angle));
            }else{
                var second_joint;
                switch(joint){
                    case unkns[i].nodes[0]: second_joint = unkns[i].nodes[1]; break;
                    case unkns[i].nodes[1]: second_joint = unkns[i].nodes[0]; break
                }
                var dx = second_joint.pos[0] - joint.pos[0];
                var dy = second_joint.pos[1] - joint.pos[1];
                var norm = Math.sqrt(dx*dx+dy*dy);
                rows[0].push(dx/norm);
                rows[1].push(dy/norm);
            }
            
        }else{
            rows[0].push(0);
            rows[1].push(0);
        }
    }
    return rows;
}

//Solve the bridge
function find_truss_forces(R_forces){
    var beams = get_forces_of_type('beam',edges);
    var reactions = get_forces_of_type('reaction',edges);    
    joints_matrix = [];
    var initial_state=[];
    var net_sum = zeros(2*joints.length);
    var net_load = [];
    //net_load + joints_matrix*unknowns = net_sum
    for(var i=0; i<joints.length; i++){
        joints_matrix = joints_matrix.concat(sum_of_forces(joints[i]));
        net_load= net_load.concat(sum_of_loads(joints[i]));
    }
    for(var i=0; i<2*joints.length; i++){
        initial_state.push(net_sum[i] - net_load[i]);
    }
    return solve_by_qr_decomp(joints_matrix,initial_state);
}

//Returns a failure factor
function find_fail_ratio(force,fail_force){
    return force/fail_force;
}
//Find the buckling force for a beam given E - Elastic modulus, I - Second moment of Area, k - k-value of beam, L the length of the beam
function buckling_force(E,I,k,L){
    return Math.PI*Math.PI*E*I/(k*k*L*L); // Pi^2 E I /(k^2*L^2)
}

//Identify the force required to snap a beam
function yield_force(yield_stress,A){
    return yield_stress*A;
}

