
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


//Create an array with zeros
function zeros(num){
    var arr = [];
    for(var i=0; i<num; i++){
        arr.push(0);
    }
    return arr;
}


