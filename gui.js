
//Clone a node or anchor
function start(id){
    var component = document.getElementById(id); 
        var sq;
        switch(component.id){
            case "joint":
            case "anchor":
                sq = component.cloneNode(true);
                sq.id = component.id + "-" + counts[component.id];
                sq.class = component.id;
                eval(component.id+"s").push(new node(sq.id, [], component.id));
                counts[component.id]++;
                document.getElementById('dots').appendChild(sq);
                glow();
                break;
            default:
                sq = component;
        }
        held = true; 
        vertex_id = sq.id;
        offsetX = window.event.clientX - sq.style.left.replace("px","");
        offsetY = window.event.clientY - sq.style.top.replace("px","");
}

//User drags object
function drag(){
    if(held){
        var sq = document.getElementById(vertex_id);
        sq.style.left = window.event.clientX-offsetX;
        sq.style.top = window.event.clientY-offsetY;
        id_to_object(vertex_id,eval(vertex_id.split("-")[0]+"s")).pos=[+sq.style.left.replace("px",""),-sq.style.top.replace("px","")]
        drawlines(vertex_id);
        //for(var i = 0; i<vertex_id.length; i++){drawlines();}
    }
}

//User stopped dragging
function end(){
    if(vertex_id!="" && vertex_id!=undefined){
        var item = document.getElementById(vertex_id);
        var trash = document.getElementById('trash');
        var item_xpos = parseFloat(item.style.left.replace("px","")) + 16/2;
        var item_ypos = parseFloat(item.style.top.replace("px","")) + 16/2;
        var del_xpos = parseFloat(trash.style.left.replace("px","")) + 64/2;
        var del_ypos = parseFloat(trash.style.top.replace("px","")) + 64/2;
        var dy = item_ypos - del_ypos;
        var dx = item_xpos - del_xpos;
        var norm= Math.sqrt(dx*dx + dy*dy);
        if(norm<64*0.7){    
            delete_node(vertex_id);
            held = false;
            vertex_id = "";
        }    
    }
    held = false;
}

//Draw lines connecting all the nodes
function drawlines(id){
    var node1 = id_to_object(id,eval(id.split("-")[0]+"s"));
    for(var i=0; i<node1.edges.length; i++){
        var edge12 = node1.edges[i];
        var second_id;
        switch(id){
            case edge12.nodes[0].id: second_id = edge12.nodes[1].id; break;
            case edge12.nodes[1].id: second_id = edge12.nodes[0].id; break;
        }
        if(edge12.type=="load" || edge12.type=="reaction"){edge12.angle = find_vec_angle(edge12.nodes);}
        var name = id+"_"+edge12.id+"_"+second_id;
        var name2 = second_id+"_"+edge12.id+"_"+id;
        var obj1=document.getElementById(edge12.nodes[0].id);
        var obj2=document.getElementById(edge12.nodes[1].id);
        if(document.getElementById(name)==null){name = name2;}
        obj2x=parseFloat(obj2.style.left.replace("px",""));
        obj2y=parseFloat(obj2.style.top.replace("px",""));
        obj1x=parseFloat(obj1.style.left.replace("px",""));
        obj1y=parseFloat(obj1.style.top.replace("px",""));
        
        xdist = obj2x - obj1x;
        ydist = obj1y - obj2y;
        radius = Math.sqrt(xdist*xdist+ydist*ydist);
        if(document.getElementById(name)==null && document.getElementById(name2)==null){
            document.getElementById("lines").innerHTML+=
                "<div id="+name+" style='position:absolute; text-align:center;'>"+
                    "<div id="+name+"_l1 style='position:absolute; height:4px; background-color:black; top:-2px; left:0px;'></div>"+
                    "<div id="+name+"_im onclick=edit('"+edge12.id+"') style='position:absolute; height:16px; width:16px; top:-8px; white-space: nowrap; text-align:center; background-image: url(\"images/"+edge12.type+".png\")'>"+
                        
                    "</div>"+
                    "<p id="+name+"_va onclick=edit('"+edge12.id+"') style='text-align:center; visibility:hidden; position: absolute; width:100%; color:grey;'>"+edge12.force+" N</p>"+
                    "<input id="+name+"_in onblur=save('"+edge12.id+"','"+name+"') style='visibility:hidden; position:absolute; width:50%; top:8px;' value="+edge12.force+">"+
                    "<p id="+name+"_so style='text-align:center;position:absolute; top:0px; left:0px; right:0px;'></p>"+
                "</div>";
        }
        
        
        var lil=document.getElementById(name);
        var imag=document.getElementById(name+"_im");
        var l1=document.getElementById(name+"_l1");
        var inp=document.getElementById(name+"_in");
        var val=document.getElementById(name+"_va");
        var sol=document.getElementById(name+"_so");
        if(edge12.force!=undefined){val.style.visibility="visible";}
        var theta=Math.atan2(ydist,xdist)/Math.PI;
        if(Math.abs(theta)>1){theta=theta-2*Math.abs(theta)/theta;}
        if(Math.abs(theta)>0.5){
            val.style.webkitTransform ="rotate("+180+"deg)";
            sol.style.webkitTransform ="rotate("+180+"deg)";
        }else{
            val.style.webkitTransform ="rotate(0deg)";
            sol.style.webkitTransform ="rotate(0deg)";
        }
        lil.style.width = radius+"px";
        lil.style.top=(obj1y+obj2y)/2+16+"px";
        lil.style.left=(obj1x+obj2x)/2-radius/2+15+"px";
        l1.style.width=radius+"px";
        l1.style.backgroundColor="#000000";
        imag.style.right=radius/2-8+"px";
        lil.style.webkitTransform="rotate("+(-180*theta)+"deg)";
        inp.style.webkitTransform="rotate("+180*theta+"deg)";
        }
    }

// Indicate nodes are connected   
function glow(){
    var state;
    for(var j=0; j<joints.length; j++){
        if(joints[j].edges.length==0){state="joint";}
        else{state="jointg";}
        document.getElementById(joints[j].id).className = state;
    }
    for(var j=0; j<anchors.length; j++){
        if(anchors[j].edges.length==0){state="anchor";}
        else{state="anchorg";}
        document.getElementById(anchors[j].id).className = state;
    }
}


//Edit load force
function doedit(e){
    if(branch.split('-')[0]=="load"){
            input=e.target.id.substring(0,e.target.id.length-3)+"_in";
            var inputElement = document.getElementById(input);
            inputElement.style.visibility="visible"; 
            inputElement.value=id_to_object(branch,edges).force;
            inputElement.focus();
    }
    window.removeEventListener("click", doedit);
}

//Save load force entered
function dosave(){
    var inp = document.getElementById(element+"_in");
    var val = document.getElementById(element+"_va");
    inp.style.visibility="hidden";
    var load = id_to_object(branch,edges);
    var force_value = parseFloat(inp.value);
    if(force_value<0){
        var temp = load.nodes[0];
        load.nodes[0] = load.nodes[1];
        load.nodes[1] = temp;
        force_value = - force_value;
        drawlines(load.nodes[0].id);
    }
    load.force=force_value;
    if(branch.split('-')[0]=="load"){
        val.innerHTML=force_value+" N"; 
        val.style.visibility="visible";
    }
    window.removeEventListener("mouseup",dosave);
}        

//Connect component
function connect(component){
    connected=false; 
    count=0; 
    list=[]; 
    element=component; 
    window.addEventListener("mouseup",click);
}

//Remove edge
function disedge(){
    window.addEventListener("mouseup",unedge);
}

//Remove node
function disnode(){
    window.addEventListener("mouseup",unnode);
}

//Edit load
function edit(load){
    branch=load; 
    window.addEventListener("click", doedit);
}

//Save load
function save(load,name){
    branch=load; 
    element=name; 
    window.addEventListener("mouseup", dosave);
}


//Highlight weak members
function highlight_weak(fail_type,weakest_member,force,fail_force){
    if(weakest_member.id!=undefined){
        var name = weakest_member.nodes[0].id+"_"+weakest_member.id+"_"+weakest_member.nodes[1].id;
        var name2 = weakest_member.nodes[1].id+"_"+weakest_member.id+"_"+weakest_member.nodes[0].id;
        var fail_ratio = find_fail_ratio(force,fail_force);
        if(document.getElementById(name)==null){name = name2;}
        var fail_color;
        if(fail_type=="break"){
            document.getElementById(name+"_so").innerHTML+=" "+fail_ratio.toFixed(2);
            if(fail_ratio<1){fail_type="none";}
        }
        switch(fail_type){
            case "buckling": fail_color = "#ff0000"; break;
            case "break": fail_color="#cccccc"; break;
            case "yield": fail_color = "#0000ff"; break;
            case "none": fail_color = "#000000"; break;
        }
        document.getElementById(name+"_l1").style.backgroundColor=fail_color;
    }
}

//Print a matrix onto the console
function print_matrix(mat){
    for(var j=0; j<mat.length; j++){
        var line="";
        for(var i=0; i<mat[0].length; i++){line+=mat[i][j].toFixed(2)+" ";}
        console.log(line);
    }
}

//Show information
function showinfo(str){document.getElementById("queryinfo").innerHTML+=str+"<br>";}

//Show help
function showhelp(){
    document.getElementById("queryinfo").innerHTML="Documentation:"+"<br>"+
        "This program uses Truss bridge analysis to solve for structural members"+"<br>"+
        "Click on the images to add a connector to a structure"+"<br><br>"+
        "List of buttons:"+"<br>"+
        "Beam: This adds a beam between any two connectors that are selected"+"<br>"+
        "Load: This adds a load to the structure. The default value of a load is 1 N and the magnitude of the load can be changed by clicking on the load"+"<br>"+
        "Reaction: This adds one support to the structure that provides a reaction in one direction."+"<br>"+
        "Delete node: This removes all components connected to a node in the structure"+"<br>"+
        "Delete edge: This removes a force or member in the structure"+"<br>"+
        "Solve the structure: This finds the force through the beams in a structure, and finds the reaction forces<br>"+
        "Shortcut keys: Press b,l,r to add beams,loads and reactions. Press j and a to add joints and anchors. Press s for solving.<br>"
        "Note: To solve the structural equations, the system must be determinate. That is, m+r = 2j, where m is the number of beams, r is number of reactions and j is the number of joints";
    }

//Clear information
function del(){
    document.getElementById("queryinfo").innerHTML="";
}    


//User clicks on object
function click(e){
    var id = e.target.id;
    if(!connected && id.indexOf('-')!=-1){
        var obj = id_to_object(id,eval(id.split('-')[0]+'s'));
        var index = list.indexOf(obj);
        var color;
        if(index!=-1){list.splice(index,1); state = obj.type; count--;}
        else{list.push(obj); state = obj.type+'g'; count++;}
        e.target.className = state;
        if(count>=2){
            if(!edge_exists(list[0],list[1])){
            connected=true; 
            edges.push(new edge(element+"-"+edge_count[element],list,element,find_vec_angle(list),1));
            list[0].edges.push(edges.slice(-1)[0]);
            list[1].edges.push(edges.slice(-1)[0]);
            edge_count[element]+=1;
            drawlines(list[0].id);
            drawlines(list[1].id);
            window.removeEventListener("mouseup", click);
        }
        }
    }
}

//Remove the node associated with the target id
function delete_node(target_id){
    var primary_node = document.getElementById(target_id);
    var primary = id_to_object(target_id,eval(target_id.split("-")[0]+"s"));
    var num_edges = primary.edges.length;
    for(var i=0; i<num_edges; i++){
        var dedge = primary.edges[0];
        var second;
        switch(target_id){
            case dedge.nodes[0].id: 
                second = id_to_object(dedge.nodes[1].id,eval(dedge.nodes[1].id.split("-")[0]+"s")); 
                break;
            case dedge.nodes[1].id: 
                second = id_to_object(dedge.nodes[0].id,eval(dedge.nodes[0].id.split("-")[0]+"s")); 
                break;
            default: console.log("Data is broken");
        }
        remove_weak(dedge.id);
        var edge1 = document.getElementById(target_id+"_"+dedge.id+"_"+second.id);
        var edge2 = document.getElementById(second.id+"_"+dedge.id+"_"+target_id);
        primary.edges.splice(id_to_index(dedge.id,primary.edges),1);
        second.edges.splice(id_to_index(dedge.id,second.edges),1);
        if(edge1!=null){document.getElementById("lines").removeChild(edge1);}
        if(edge2!=null){document.getElementById("lines").removeChild(edge2);}
        edges.splice(id_to_index(dedge.id,edges),1);
    }    
    document.getElementById("dots").removeChild(primary_node);    
    switch(target_id.split("-")[0]){
        case "joint":
            joints.splice(id_to_index(target_id,joints),1); break;
        case "anchor": 
            anchors.splice(id_to_index(target_id,anchors),1); break;
    }
    glow();
}

//Keyboard shortcuts
function key_short(e){
    switch(e.keyCode){
        case 66: case 98: connect('beam'); break;//beam B
        case 76: case 108: connect('load'); break; //load L
        case 82: case 114: connect('reaction'); break; //reaction R
        case 83: case 115: solve_all(); break; //solve S
        case 74: case 106: start('joint'); offsetX=16; offsetY=76; drag(); break; //J
        case 65: case 97: start('anchor'); offsetX=16; offsetY=76; drag(); break;// A
    }
}

//Delete node
function unnode(e){
    delete_node(e.target.id);
    window.removeEventListener("mouseup", unnode);
}

//Delete edge
function unedge(e){
    window.removeEventListener("mouseup", unedge);
    string_htot = e.target.id.split("_");
    if(string_htot.length>=3){
        node1 = id_to_object(string_htot[0],eval(string_htot[0].split("-")[0]+"s"));
        node2 = id_to_object(string_htot[2],eval(string_htot[2].split("-")[0]+"s"));
        node1.edges.splice(id_to_index(string_htot[1],node1.edges),1);
        node2.edges.splice(id_to_index(string_htot[1],node2.edges),1);
        edges.splice(id_to_index(string_htot[1],edges),1);
        remove_weak(string_htot[1]);
        var edge1 = document.getElementById(string_htot[0]+"_"+string_htot[1]+"_"+string_htot[2]);
        var edge2 = document.getElementById(string_htot[2]+"_"+string_htot[1]+"_"+string_htot[0]);
        if(edge1!=null){document.getElementById("lines").removeChild(edge1);}
        if(edge2!=null){document.getElementById("lines").removeChild(edge2);}
        glow();
    }
}


//Identify weak points in bridge
function solve_all(){
    //reaction_forces = find_reactions();
    var beams = get_forces_of_type('beam',edges);
    var reactions = get_forces_of_type('reaction',edges);
    if(beams.length+reactions.length!=2*joints.length){
        showinfo("Error: m+r=2j must be true");
        return;
    }    
    final_forces = find_truss_forces(reaction_forces);
    var forces = [].concat(beams,reactions);
    var max_tension = 0, max_buckling_compression=0, max_squash_compression=0, max_buckling=0;
    buckling_link={}; tension_link={}; squash_link={};
    for(var j=0; j<final_forces.length; j++){
        highlight_weak("none",forces[j]);
        if(final_forces[j]<0 && forces[j].type=='reaction'){
            var temp = forces[j].nodes[0];
            forces[j].nodes[0] = forces[j].nodes[1];
            forces[j].nodes[1] = temp;
            final_forces[j] = - final_forces[j];
            drawlines(forces[j].nodes[0].id);
        }
        var name1 = forces[j].nodes[0].id+"_"+forces[j].id+"_"+forces[j].nodes[1].id+"_so";
        var name2 =forces[j].nodes[1].id+"_"+forces[j].id+"_"+forces[j].nodes[0].id+"_so";        
        if(document.getElementById(name1)==null){
            document.getElementById(name2).innerHTML=+final_forces[j].toFixed(2)+" N";
        }else{
            document.getElementById(name1).innerHTML=+final_forces[j].toFixed(2)+" N";
        }

        var scale = parseFloat(document.getElementById("scale").value);
        var E = parseFloat(document.getElementById("modulus").value);
        var I = parseFloat(document.getElementById("smoa").value);
        var A = parseFloat(document.getElementById("area").value);
        var yield_stress = parseFloat(document.getElementById("stress_y").value);
        
        var length = norm(add([forces[j].nodes[0].pos],s_mult([forces[j].nodes[1].pos],-1))[0])*scale;
        
        if(forces[j].type=='beam'){
            if(final_forces[j]>0){
                highlight_weak("break",forces[j],Math.abs(final_forces[j]),yield_force(yield_stress,A));
            }else{
                if(yield_force(yield_stress,A)<buckling_force(E,I,1,length)){
                    highlight_weak("break",forces[j],Math.abs(final_forces[j]),yield_force(yield_stress,A));
                }else{
                    highlight_weak("break",forces[j],-final_forces[j],buckling_force(E,I,1,length));
                }
            }
        }
        
        if(final_forces[j]>max_tension && forces[j].type=='beam'){max_tension = final_forces[j]; tension_link = forces[j];}
        if(-final_forces[j]>max_squash_compression){
            max_squash_compression = -final_forces[j];
            squash_link = forces[j];
        }
        if(-final_forces[j]*length*length>max_buckling && forces[j].type=='beam'){
            max_buckling = -final_forces[j]*length*length;
            max_buckling_compression = -final_forces[j];
            buckling_link = forces[j];
        }    
    }
    showinfo("Critical members:");
    showinfo("Tension:" +find_fail_ratio(max_tension,yield_force(yield_stress,A)).toFixed(2));
    showinfo("Buckling:"+find_fail_ratio(max_buckling_compression,buckling_force(E,I,1,length)).toFixed(2));
    showinfo("Squash:"+find_fail_ratio(max_squash_compression,yield_force(yield_stress,A)).toFixed(2));
    showinfo("\n");
}


//Keyboard shortcuts
window.addEventListener("keypress",key_short);
