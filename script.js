const video = document.getElementById('video')
const input = document.getElementById('output')

function loadModels() {
    console.log('loading models...')
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models')
    ]).then(loaded);
}
function loaded() {
    console.log('models loaded successfully')
    document.querySelector('.upload-label').classList.remove('disabled');
    document.querySelector('.model-load').classList.add('hidden');
}

loadModels();

let canvas;
var loadFile = async function (evt) {
    if (input.src.length != 0) { canvas.remove() }

    var tgt = evt.target || window.event.target,
        files = tgt.files;
    if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('output').src = fr.result;
        }
        fr.readAsDataURL(files[0]);
        fr.addEventListener('progress', (event) => {
            if (event.loaded && event.total) {
                setTimeout(() => {
                    startRecognition(0);
                }, 1500);
            }
        });
    }
};

// FOR IMPORTED IMAGE 
async function startRecognition() {
    console.log('loading canvas');
    canvas = faceapi.createCanvasFromMedia(input)

    var displaySize = { width: input.width, height: input.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(input, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptors()
    if (!detections.length) {
        alert('face not detected');
        return;
    }
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    resizedDetections.forEach(result => {
        const { age, gender, genderProbability, expressions } = result
        new faceapi.draw.DrawTextField([
            `${faceapi.utils.round(age, 0)
            } years`,
            `${gender} (${faceapi.utils.round(genderProbability)
            })`,
            `${faceapi.utils.round(expressions.neutral)
            } neutral`,
            `${faceapi.utils.round(expressions.angry)
            } angry`,
            `${faceapi.utils.round(expressions.happy)
            } happy`
        ], result.detection.box.bottomLeft).draw(canvas)
    })

    document.body.querySelector('.canvas').append(canvas);
}

// FOR LIVE WEBCAM FEED
let localStream;
function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        (stream) => {
            video.srcObject = stream;
            localStream = stream;
        },
        err => console.error(err)
    )
}

var tempFeed, tempCanvas;
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    tempCanvas = canvas;
    document.body.querySelector('.user-video').append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    tempFeed = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        resizedDetections.forEach(result => {
            const { age, gender, genderProbability, expressions } = result
            new faceapi.draw.DrawTextField([
                `${faceapi.utils.round(age, 0)
                } years`,
                `${gender} (${faceapi.utils.round(genderProbability)
                })`,
                `${faceapi.utils.round(expressions.neutral)
                } neutral`,
                `${faceapi.utils.round(expressions.angry)
                } angry`,
                `${faceapi.utils.round(expressions.happy)
                } happy`
            ], result.detection.box.bottomLeft).draw(canvas)
        })

    }, 100)
})
