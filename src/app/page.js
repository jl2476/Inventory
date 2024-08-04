'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

import searchByUPC from './UPC';


// Used for styling 
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}



export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [upc, setUpc] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(null) // null, 'name', or 'upc'
  const [choiceModalOpen, setChoiceModalOpen] = useState(false)

  const updateInventory = async () => {
    try {
      const search = query(collection(firestore, 'inventory'))
      const snapshot = await getDocs(search)

      const inventory = []
      snapshot.forEach((item) => {
        inventory.push({ id: item.id, ...item.data() })
      })
      setInventory(inventory)
    } catch (error) {
      console.error('Error updating inventory: ', error)
    }
  };

  useEffect(() => {
    updateInventory()
  }, []);

  const addItem = async () => {
    try {
      if (!selectedMethod) {
        console.error('No method selected');
        return;
      }

      if (selectedMethod === 'upc') {
        // Handle UPC: fetch product details
        const productDetails = await searchByUPC(upc);

        // Check if productDetails is not null or undefined
        if (!productDetails) {
          console.error('No product details found for this UPC');
          return;
        }

        // Destructure and check if name and fetchedUPC are defined
        const { name, upc: fetchedUPC } = productDetails;


        // Use the fetched name and UPC for Firestore
        const itemDocRef = doc(collection(firestore, 'inventory'), fetchedUPC);

        const snapshot = await getDoc(itemDocRef);

        if (!snapshot.exists()) {
          // Create a new item with details from UPC
          await setDoc(itemDocRef, { name, quantity: 1, upc: fetchedUPC });
        } else {
          // Update quantity if item exists
          const data = snapshot.data();
          const quantity = data?.quantity ?? 0;
          await setDoc(itemDocRef, { ...data, quantity: quantity + 1 }, { merge: true });
        }
      } else if (selectedMethod === 'name') {
        // Handle name
        if (!itemName) {
          console.error('Item name is undefined or empty');
          return;
        }

        const itemDocRef = doc(collection(firestore, 'inventory'), itemName);
        const snapshot = await getDoc(itemDocRef);

        if (!snapshot.exists()) {
          // Create a new item with name
          await setDoc(itemDocRef, { quantity: 1, name: itemName, upc: '' });
        } else {
          // Update quantity if item exists
          const data = snapshot.data();
          const quantity = data?.quantity ?? 0;
          await setDoc(itemDocRef, { ...data, quantity: quantity + 1 }, { merge: true });
        }
      }

      // Update inventory list
      await updateInventory();
    } catch (error) {
      console.error('Failed to add item: ', error);
    }
  };


  const removeItem = async (id) => {
    try {
      const itemDocRef = doc(collection(firestore, 'inventory'), id);

      const snapshot = await getDoc(itemDocRef);

      if (snapshot.exists()) {
        const { quantity } = snapshot.data();

        if (quantity === 1) {
          await deleteDoc(itemDocRef);
        } else {
          await setDoc(itemDocRef, { quantity: quantity - 1 }, { merge: true });
        }
      }

      await updateInventory();
    } catch (error) {
      console.error('Failed to remove item: ', error);
    }
  };

  const handleChoiceOpen = () => setChoiceModalOpen(true);
  const handleChoiceClose = () => setChoiceModalOpen(false);

  const handleOpen = () => {
    handleChoiceOpen();
    setItemName('');
    setUpc('');
    setSelectedMethod(null);
  };

  const handleAddItem = () => {
    addItem();
    handleClose();
    handleChoiceClose();
  };

  const handleClose = () => setOpen(false);

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={choiceModalOpen}
        onClose={handleChoiceClose}
        aria-labelledby="choice-modal-title"
        aria-describedby="choice-modal-description"
      >
        <Box sx={style}>
          <Typography id="choice-modal-title" variant="h6" component="h2">
            Choose Input Method
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedMethod('name');
                handleChoiceClose();
                setOpen(true);
              }}
            >
              Item Name
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedMethod('upc');
                handleChoiceClose();
                setOpen(true);
              }}
            >
              UPC
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            {selectedMethod === 'name' && (
              <TextField
                id="item-name"
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
              />
            )}
            {selectedMethod === 'upc' && (
              <TextField
                id="item-upc"
                label="UPC"
                variant="outlined"
                fullWidth
                value={upc}
                onChange={(e) => setUpc(e.target.value)}
                placeholder="Enter UPC"
              />
            )}
            <Button
              variant="outlined"
              onClick={handleAddItem}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      <Box border={'1px solid #333'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {inventory.map(({ id, name, quantity }) => (
            <Box
              key={id}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name ? name.charAt(0).toUpperCase() + name.slice(1) : id}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              <Button variant="contained" onClick={() => removeItem(id)}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
