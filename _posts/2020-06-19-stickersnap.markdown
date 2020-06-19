---
title: StickerSnap — The AI Sticker Maker
layout: post
category: doing
tags: [computer-vision, stickers, whatsapp, telegram, flask, web-app]
logo: sticky-note-o
---

These last days I have been working on a little side project of mine: [StickerSnap](http://stickersnap.nur.systems). **It solves a crucial problem**: getting rid of the background in your pictures so that you can create the best stickers for social apps like WhatsApp or Telegram!

I started working on it shortly after seeing a [fascinating tweet](https://twitter.com/cyrildiagne/status/1256916982764646402) and [repo by Cyril Diagne](https://github.com/cyrildiagne/BASNet-http). My first step was to change the Docker image around: I wanted it to **only output the segmented region**. I played around with Github's project management tools and tricked a couple of colleagues into sending PRs. 

My next step was figuring out how to **get the docker container to run with the GPUs on my little server**, and to deploy on every commit to master. It took a little playing around, eventually leading me to [Nvidia's Docker repository](https://github.com/NVIDIA/nvidia-docker) and, more interestingly, **setting up my own Jenkins installation**. You can see in the repo the exact command that gets run by Jenkins, crudely implementing CD but not CI. It runs unit tests, prepares the Docker image, pushes it to DockerHub and executes a new container with it. **The tests are admittedly not enough**: if this were to go anywhere near production, tests to check different requests and input types would be needed, rather than just the image processing functions. Integration tests with the web app would also be helpful. **Contributions here would be appreciated.**

The final step was developing a **simple web interface**. A container with a Flask app running a simple REST API is cool, but it's better to have something visual. **I went with Vuejs, which I have enjoyed using over a year due to its simplicity**, and particularly [Buefy](https://buefy.org). The prototyping speed you can get out of it is marvellous! In a short period of time, I could **upload images and send requests with Axios to the Docker container**. They would then show up in the app as they were asynchronously processed. 

To deploy the static website, I decided to **delve into the AWS stack for the first time**. The deployment is straightforward: **the distribution build goes into a fully public S3 bucket**. I simply add a new subdomain on `nur.systems`, namely, [stickersnap.nur.systems](http://stickersnap.nur.systems/), and call it a day. 

Building StickerSnap has been a lot of fun. I have had to go from a computer vision model to image processing functions, from a REST API to a responsive front-end. I have learned a couple of things implementing the whole project, managing my server to install Jenkins and deal with GPU usage. More importantly, **there are many things that could be improved on all fronts**! For instance:

* The model is baked within the Docker image, which makes it huge. I could look into **quantizing the model to make it smaller**, or **running it on the client side so your personal pictures never leave your browser**! Since it is a PyTorch model, I would probably need to convert it to Tensorflow to be compatible with [TF.js](https://www.tensorflow.org/js).

* There are **[newer object segmentation architectures](https://twitter.com/cyrildiagne/status/1257572501753864192?s=20)** that could make the output stickers even sharper and more accurate.

* BASNet is a great model, but it still gets it wrong at times. As **the most reliable way of improving any ML system is more data**, users should have a small editor to correct faulty segmentations. These user corrections would then be saved and used to **improve the model with active learning**! Even just the editor would give value to the users, as they **would not need to hop on another app to fix the images**!

* **I have only scratched the surface of the CI/CD setup.** A robust way of dealing with the project would involve keeping the **[Jenkins configuration](https://medium.com/slalom-build/automatically-generating-jenkins-jobs-d30d4b0a2b49) in the repo, to allow for migration and versioning**. 

* **Current tests are not enough.** The front-end should have tests. The back-end should have tests. The interaction between the two should be tested! 

* The app is running through HTTP rather than HTTPS! **This means your images are being sent 'in the clear'**, which concerns me quite a bit as a privacy nut. Although S3 buckets are HTTP only, it is possible to [set up an HTTPS front](https://levelup.gitconnected.com/deploying-vue-js-to-aws-with-https-and-a-custom-domain-name-3ae1f79fe188). I originally intended to do this, but I had forgotten that **mixed cross-origin requests would get blocked** as the Docker image runs HTTP. Nevertheless, it would be possible to change that by **using [NGINX and LetsEncrypt](https://github.com/smallwat3r/docker-nginx-gunicorn-flask-letsencrypt), and have everything beautiful, HTTPS and nice.** 

I am more than happy to get contributions or comments on the repos over at the [nur.systems](https://github.com/nur-systems) GitHub organization. Until then, let's get these stickers rolling!


