'use client'

import { useState, useEffect } from 'react'

// @mui is a namespace from the npm registry
import { Box, Stack, Typography, Button, Modal, TextField, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteIcon from '@mui/icons-material/Delete'

// @/ prefix is used to signify that the project should look in the src directory
import { firestore, storage } from '@/utils/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

import searchByUPC from '../utils/UPC'

import { compressImage, uploadImage, updateItemImage, handleFileUpload } from '../utils/image.js'

import { ref, getDownloadURL } from 'firebase/storage';

import styles from './page.module.css'



export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [upc, setUpc] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const updateInventory = async () => {
    try {
      const search = query(collection(firestore, 'inventory'))
      const snapshot = await getDocs(search)

      const inventory = []
      snapshot.forEach((item) => {
        inventory.push({ id: item.id, ...item.data() })
      })
      setInventory(inventory)
      setFilteredInventory(inventory)
    } catch (error) {
      console.error('Error updating inventory: ', error)
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  useEffect(() => {
    const filtered = inventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredInventory(filtered)
  }, [searchTerm, inventory])



  const addItem = async () => {
    try {
      const defaultRef = ref(storage, `default.png`);
      const defaultImage = await getDownloadURL(defaultRef);

      let itemData = {
        quantity: parseInt(quantity) || 1, // Default to 1 if quantity is not provided
        imageUrl: defaultImage,
      };

      if (itemName) {
        // Handle name
        itemData.name = itemName; // Set name if provided

        const itemDocRef = doc(collection(firestore, 'inventory'), itemName);
        await setDoc(itemDocRef, itemData);

        setImageUrl(defaultImage);
        console.log(defaultImage);

        await updateInventory();
      }
      else if (upc) {
        // Handle UPC: fetch product details
        const productDetails = await searchByUPC(upc);

        // Check if productDetails is not null or undefined
        if (!productDetails) {
          console.error('No product details found for this UPC');
          return;
        }

        // Set item data using product details
        itemData = {
          ...itemData,
          name: productDetails.name,
          upc: productDetails.upc,
          imageUrl: productDetails.images[0] || itemData.imageUrl // Use image from product details or default
        };

        // Use the fetched UPC for Firestore
        const itemDocRef = doc(collection(firestore, 'inventory'), productDetails.upc);
        await setDoc(itemDocRef, itemData);

        await updateInventory();
      } else {
        console.error('Either UPC or item name must be provided');
        return; // Exit if neither is provided
      }

      // Check if an image file is selected and upload it
      if (imageUrl instanceof File) {
        itemData.imageUrl = await uploadImage(imageUrl);
      } else if (imageUrl) {
        itemData.imageUrl = imageUrl;
      }

      // Update inventory list
      await updateInventory();
      handleClose();
    } catch (error) {
      console.error('Failed to add item: ', error);
    }
  };

  const updateItemQuantity = async (id, change) => {
    try {
      const itemDocRef = doc(collection(firestore, 'inventory'), id)
      const snapshot = await getDoc(itemDocRef)

      if (snapshot.exists()) {
        const { quantity } = snapshot.data()
        const newQuantity = quantity + change

        if (newQuantity < 0) {
          await deleteDoc(itemDocRef)
        } else {
          await setDoc(itemDocRef, { quantity: newQuantity }, { merge: true })
        }

        await updateInventory()
      }
    } catch (error) {
      console.error('Failed to update item quantity: ', error)
    }
  }


  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setQuantity(0)
    setUpc('')
    setImageUrl('')
  }




  return (
    <Box className={styles.container} style={{ backgroundColor: '#121212' }}>
      <Typography variant="h4" component="h1" style={{ color: 'white' }}>Pantry Management</Typography>
      <TextField
        placeholder="Search by item name..."
        variant="outlined"
        fullWidth
        style={{ marginBottom: '1rem', backgroundColor: '#1e1e1e', color: 'white' }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          style: { color: 'white' }
        }}
      />
      <Button
        variant="contained"
        onClick={handleOpen}
        style={{ backgroundColor: '#1e1e1e', color: 'white' }}
      >
        Add Item
      </Button>
      <Button
        variant="contained"
        style={{ marginLeft: '1rem', backgroundColor: '#1e1e1e', color: 'white' }}
      >
        Suggest Recipe
      </Button>

      <Modal open={open} onClose={handleClose}>
        <Box className={styles.modalStyle} style={{ backgroundColor: '#1e1e1e', color: 'white' }}>
          <Typography variant="h6" component="h2">
            Add New Item
          </Typography>
          <Typography>Fill out the form to add a new item to your inventory.</Typography>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            InputProps={{
              style: { color: 'white' }
            }}
          />
          <TextField
            label="Quantity"
            variant="outlined"
            fullWidth
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            InputProps={{
              style: { color: 'white' }
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            style={{ marginTop: '1rem', marginBottom: '1rem' }}
          />
          <TextField
            label="UPC (optional)"
            variant="outlined"
            fullWidth
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            InputProps={{
              style: { color: 'white' }
            }}
          />
          <Button variant="contained" onClick={addItem} style={{ marginTop: '1rem' }}>
            Add
          </Button>
          <Button variant="outlined" onClick={handleClose} style={{ marginTop: '1rem', marginLeft: '1rem' }}>
            Cancel
          </Button>
        </Box>
      </Modal>

      <Stack className={styles.inventoryList} spacing={2}>
        {filteredInventory.map(({ id, name, quantity, imageUrl }) => (
          <Box key={id} className={styles.inventoryItem}>
            <img src={imageUrl || defaultImage} alt={name} className={styles.itemImage} />
            <Typography className={styles.itemName}>{name}</Typography>
            <Typography className={styles.itemQuantity}>Quantity: {quantity}</Typography>
            <Stack direction="row" spacing={1} className={styles.itemActions}>
              <IconButton className={styles.actionIcon} onClick={() => updateItemQuantity(id, -1)}>
                <RemoveIcon />
              </IconButton>
              <IconButton className={styles.actionIcon} onClick={() => updateItemQuantity(id, 1)}>
                <AddIcon />
              </IconButton>
              <IconButton className={styles.actionIcon} onClick={() => updateItemQuantity(id, -quantity - 1)}>
                <DeleteIcon />
              </IconButton>
            </Stack>

          </Box>
        ))}
      </Stack>
    </Box>
  )
}