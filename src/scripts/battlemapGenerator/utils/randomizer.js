export class Random {

    image(image_list) {
        if (!Array.isArray(image_list) || image_list.length === 0) {
            throw new Error("The image list is empty or not an array.");
        }
        return image_list[Math.floor(Math.random() * image_list.length)];
    }
}
