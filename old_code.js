
function solve_by_cramer(matrix,vector){
	var cramer_matrix=new Array(matrix.length);
	var solution_set=new Array(matrix.length);
	for(var j=0; j<matrix.length; j++){
		cramer_matrix[j]=new Array(matrix.length);
		for(var k=0; k<matrix.length; k++){
			cramer_matrix[j][k]=[];
			for(var l=0; l<matrix.length; l++){
				if(l==j){cramer_matrix[j][k].push(vector[k]);}
				else{cramer_matrix[j][k].push(matrix[k][l]);}
			}
		}
		solution_set[j]=det(cramer_matrix[j])/det(matrix); //Uses Cramers Method to solve the matrix equation and find the loop currents
	}
	return solution_set;
}

function det(mat){
	if(mat.length==1){return mat[0][0];}
	else if(mat.length==2){return mat[0][0]*mat[1][1]-mat[0][1]*mat[1][0];}
	else{
		var sum=0;
		var temp_col=new Array(mat.length);
		var table2=mat.slice(0,0).concat(mat.slice(1,mat.length));
		for(var j=0; j<mat.length; j++){
			for(var k=0; k<mat.length-1; k++){temp_col[k] = table2[k].splice(j,1);}
			if(mat[0][j]!=0){sum+=-2*(j%2-0.5)*mat[0][j]*det(table2);}
			for(var k=0; k<mat.length-1; k++){table2[k].splice(j,0,temp_col[k]);}
		}
		return sum;
	}
}

function find_reactions(){
	var reactions = get_forces_of_type('reaction',edges);
	var loads = get_forces_of_type('load',edges);
	if(reactions.length!=3){showinfo("3 reactions are required"); return;}
	var reaction_matrix = new Array(reactions.length);
	var intial_state = new Array(reactions.length);
	var net_sum = [0,0,0];
	var net_load = [];
	//net_load + reaction_matrix*reaction_unknowns = net_sum
	reaction_matrix[0] = [];
	reaction_matrix[1] = [];
	reaction_matrix[2] = [];
	for(var i=0; i<reactions.length; i++){
		reaction_matrix[0].push(cos(reactions[i].angle));
		reaction_matrix[1].push(sin(reactions[i].angle));
		reaction_matrix[2].push(moment([0,0],reactions[i].nodes[0].pos,reactions[i].angle,1));
	}
	var lFx=0; var lFy=0; var lMz=0;
	for(var i=0; i<loads.length; i++){
		lFx+=cos(loads[i].angle)*loads[i].force;
		lFy+=sin(loads[i].angle)*loads[i].force;
		lMz+=moment([0,0],loads[i].nodes[0].pos,loads[i].angle,loads[i].force);
	}
	for(var i=0; i<reactions.length; i++){
		initial_state[i] = net_sum[i] - net_load[i];
	}
	return solve_by_qr_decomp(reaction_matrix,initial_state);
}

function moment(origin, pos, angle,force){
	return force*(pos[0] - origin[0])*sin(angle) - force*(pos[1] - origin[1])*cos(angle);
}