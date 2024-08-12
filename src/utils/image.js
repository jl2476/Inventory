import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/utils/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';


const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scaleFactor = Math.min(1, 800 / Math.max(img.width, img.height));
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', 0.7);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
};

const uploadImage = async (file) => {
    try {
        const compressedFile = await compressImage(file);
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        const imageUrl = await getDownloadURL(storageRef);
        return imageUrl;
    } catch (error) {
        console.error('Failed to upload image: ', error);
    }
};

const updateItemImage = async (id, newImageUrl) => {
    try {
        const itemDocRef = doc(collection(firestore, 'inventory'), id);
        await setDoc(itemDocRef, { imageUrl: newImageUrl }, { merge: true });
        await updateInventory(); // Ensure this function is defined and imported
    } catch (error) {
        console.error('Failed to update item image: ', error);
    }
};




const handleFileUpload = async (file) => {
    try {
        let imageUrl;
        if (file) {
            imageUrl = await uploadImage(file); // Upload the file and get the URL
        } else {
            imageUrl = await uploadImage(defaultImage); // Upload the default image and get the URL
        }
        setImageUrl(imageUrl);
    } catch (error) {
        console.error('Error handling file upload: ', error);
    }
};




export { compressImage, uploadImage, updateItemImage, handleFileUpload };
