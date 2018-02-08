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
var counts = {joint: 0, anchor: 0};
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

