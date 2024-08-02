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



// used for styling 
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
};



/**
 * Dynamically renders the home page
 * @returns A JSX structure that represents the rendered UI of the home page
 */
export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')


  /**
   * Queries the ‘inventory’ collection in Firestore and updates our local state;
   * We use async to allow the use of await for queries
   */
  const updateInventory = async () => {
    try {
      // creates a query to firebase for entire inventory collection
      const query = query(collection(firestore, 'inventory'))

      // waits on up to date inventory information matching the query i.e. the snapshot
      const snapshot = await getDocs(query)

      const inventory = []
      // corresponding with the query, iterates over each item in inventory
      snapshot.forEach((item) => {
        // Creates new objects representing the items in inventory 
        // uses spread operator to copy all relevant data
        inventory.push({ ...item.data, name: item.id })
      })
      // sets the inventory to the updated collection of inventory objects
      setInventory(inventory)
    } catch (error) {
      // error handling
      console.error('Error updating inventory: ', error)
    }
  };

  /**
   * Hook that ensures that the inventory is updated and ensures the below functionality
   * is properly executed when the component is mounted.
   */
  useEffect(() => {
    updateInventory()
  }, []);


  /**
   * Increases the quantity of an item in inventory by 1 and updates inventory
   * NOTE: this funct and updateInventory rely on different i.e. the latter uses queries for a list
   * of items while the former uses a document reference to the item to retrieve item information
   * @param {*} item the item being added to inventory
   */
  const addItem = async (item) => {
    try {
      // references a specified item in inventory; document reference
      const item = doc(collection(firestore, 'inventory'), item)

      // retrieves and waits for the snapshot of item information matching the REFERENCE
      const snapshot = await getDoc(item)

      // retrieves the quantity from the items data fields
      const data = snapshot.data();
      const { quantity } = data; // or const quantity = data.quantity

      // update the quantity of the item by 1
      // we have to use the spread operator to retain/set key properties/information
      // NOTE: later properties will overwrite earlier ones if they have the same key
      // if object doesn't exist quantity will default to 1 (After incrementing)
      // we could also reference with data.quantity
      await setDoc(item, { ...data, quantity: (quantity || 0) + 1 });

      // update inventory with information
      await updateInventory()
    } catch (error) {
      console.error('Failed to add item: ', error)
    }

  };

  /**
   * Decreases the quantity of an item in inventory by 1 and updates inventory
   * NOTE: this funct and updateInventory rely on different i.e. the latter uses queries for a list
   * of items while the former uses a document reference to the item to retrieve item information
   * @param {*} item the item being added to inventory
   */
  const removeItem = async (item) => {
    try {
      // references a specified item in inventory; document reference
      const item = doc(collection(firestore, 'inventory'), item)

      // retrieves and waits for the snapshot of item information matching the REFERENCE
      const snapshot = await getDoc(item)

      // checks if item information/item exists
      if (snapshot.exists()) {
        // deconstructs for item quantity
        const { quantity } = docSnap.data()
        if (quantity === 1) {
          // delete item if quantity becomes 0
          await deleteDoc(docRef)
        } else {
          // otherwise decrease quantity by 1
          await setDoc(item, { ...data, quantity: quantity - 1 })
        }
      }

      // update inventory with information
      await updateInventory()
    } catch (error) {
      console.error('Failed to remove item: ', error)
    }
  };


  /**
   * Modal control functions; Manages the modal state
   * Used in conjection w useState hook in React.
   */
  const handleOpen = () => setOpen(true);
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
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
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
          {inventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity}
              </Typography>
              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
};



