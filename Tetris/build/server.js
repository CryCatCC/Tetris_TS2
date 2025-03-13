var http = require('http');
var fs = require('fs');
const path = require('path');

var types = {
    '.html' : 'text/html',
    '.jpg' : 'image/jpeg',
    '.json' : 'application/json',
    '.js' : 'text/javascript',
    '.png' : 'image/png',
    '.css' : 'text/css',
    '.txt' : 'text/plain'
}
function loadFile(res,url,ext){

    res.setHeader("Content-type",types[ext]);
    fs.readFile("../"+url,function(err,data){
        if (err)
        {
            console.log("Error while reading file" + url);
            res.statusCode=404;
            res.write("error");
            res.end();
        }else{
            console.log("Read success: ."+url);
            res.statusCode=200;
            res.write(data);
            res.end();
        }
    })
}
let server = http.createServer(async function(req,res){
    //console.log(req.url);
    
    if (req.url=="/"){
        loadFile(res,"/build/index.html",".html");
    }else
    if (req.url=="/end"){
        process.exit();
    }
    else{
        const extname = String(path.extname(req.url).toLocaleLowerCase());
        if (extname in types){
            loadFile(res,req.url,extname);
        }else{
            res.statusCode = 404;
            res.end();
        }
    }
});

server.listen(3000,'localhost',()=>console.log("Server started at localhost:3000"));