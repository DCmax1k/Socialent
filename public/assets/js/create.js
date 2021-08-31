const file = document.getElementById('file');
const submit = document.getElementById('submit');
const dropbox = document.getElementById('dropbox');
const description = document.getElementById('description');
let airFile;

// Drop box listeners
dropbox.addEventListener('click', () => {
  file.click();
});

dropbox.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropbox.classList.add('dragover');
});
dropbox.addEventListener('dragleave', (e) => {
  dropbox.classList.remove('dragover');
});

// Set air file
dropbox.addEventListener('drop', (e) => {
  e.preventDefault();
  dropbox.classList.remove('dragover');
  airFile = e.dataTransfer.files[0];
  dropbox.innerText = airFile.name;
});

file.addEventListener('change', () => {
  if (file.value) {
    airFile = file.files[0];
    dropbox.innerText = file.value.split('\\')[
      file.value.split('\\').length - 1
    ];
  } else {
    dropbox.innerText = 'Click to choose a file or drag it here.';
  }
});

submit.addEventListener('click', async () => {
  if (airFile) {
    submit.innerText = 'Uploading...';
    let fileData = airFile;

    // Resize image
    if (fileData.type.includes('image')) {
      const reader = new FileReader();
      reader.readAsDataURL(fileData);
      reader.onload = (event) => {
          const image = new Image();
          image.src = event.target.result;
          image.onload = async (ev) => {
              const canvas = document.createElement('canvas');
              const MAX_LENGTH = 1080;
              let scaleSize;
              if (ev.target.height - ev.target.width >= 0) {
                  canvas.height = MAX_LENGTH;
                  scaleSize = canvas.height / ev.target.height;
                  canvas.width = ev.target.width * scaleSize;
              } else {
                  canvas.width = MAX_LENGTH;
                  scaleSize = canvas.width / ev.target.width;
                  canvas.height = ev.target.height * scaleSize;
              }
              const ctx = canvas.getContext('2d');
              ctx.drawImage(ev.target, 0, 0, canvas.width, canvas.height);
              const encodedSrc = ctx.canvas.toDataURL('image/jpeg');

              // Convert dataURI to blob
              const byteString = atob(encodedSrc.split(',')[1]);

              // separate out the mime component
              const mimeString = encodedSrc.split(',')[0].split(':')[1].split(';')[0];

              // write the bytes of the string to an ArrayBuffer
              const ab = new ArrayBuffer(byteString.length);

              var ia = new Uint8Array(ab);
              for (var i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
              }
              // give blob file name
              const blob =  new Blob([ab], {
                type: mimeString,
              });
              const fileName = fileData.name;
              fileData = blob;

              const data = new FormData();
              data.append('file', fileData);
              data.append('description', description.value);
              data.append('filename', fileName);
              const options = {
                method: 'POST',

                body: data,
              }
              const res = await fetch('/create/createpost', options);
              const resJSON = await res.json();

              if (resJSON.status == 'successful') {
                window.location.href = `/home`;
                submit.innerText = 'Submit';
              }
          }
      }
    } else {
      console.log(fileData);
      const data = new FormData();
      data.append('file', fileData);
      data.append('description', description.value);
      data.append('filename', fileData.name);
      const options = {
        method: 'POST',

        body: data,
      }
      const res = await fetch('/create/createpost', options);
      const resJSON = await res.json();

      if (resJSON.status == 'successful') {
        window.location.href = `/home`;
        submit.innerText = 'Submit';
      }
    }
  }
});
