function cs_CanvasSaver(url) {
    this.url = url;

    this.savePNG = function(cnvs, fname) {
        if(!cnvs || !url) return;
        fname = fname || 'image';

        var data = cnvs.toDataURL("image/png");
        data = data.substr(data.indexOf(',') + 1).toString();

        var dataInput = document.createElement("input") ;
        dataInput.setAttribute("name", 'imgdata') ;
        dataInput.setAttribute("value", data);
         
        var nameInput = document.createElement("input") ;
        nameInput.setAttribute("name", 'name') ;
        nameInput.setAttribute("value", fname + '.png');
         
        var myForm = document.createElement("form");
        myForm.method = 'post';
        myForm.action = url;
        myForm.appendChild(dataInput);
        myForm.appendChild(nameInput);
         
        //document.body.appendChild(myForm) ;
        //myForm.submit() ;
        //document.body.removeChild(myForm) ;
		alert("Right click on the image and choose save.");
    };
     
    this.generateButton = function (label, cnvs, fname) {
        var btn = document.createElement('button'), scope = this;
        btn.innerHTML = label;
        btn.style['class'] = 'canvassaver';
        btn.addEventListener('click', function(){scope.savePNG(cnvs, fname);}, false);
         
        document.body.appendChild(btn);
         
        return btn;
    };
}

var cs_csave;
if (location.protocol === 'https:')		
	cs_csave = new cs_CanvasSaver('https://www.artbylogic.com/common/b64_to_png.php');
else	
	cs_csave = new cs_CanvasSaver('http://www.artbylogic.com/common/b64_to_png.php');
	
//var cs_csave = new cs_CanvasSaver('http://www.artbylogic.com/spirographart/b64_to_png.php');
//cs_csave.generateButton('save an image!', cnvs, 'myimage');
//cs_csave.savePNG(document.getElementById('can'));
