import create from 'zustand';

type store = {
  activeUsers: any;
  userSpecificId: string;
  userConnectionGradients: any;
};

type conStore = {
  userConnectionGradients: any;
};

const useStore = create<store>((set) => ({
  activeUsers: {},
  userSpecificId: '',
  userConnectionGradients: {}
}));

const useConStore = create<conStore>((set) => ({
  userConnectionGradients: {}
}));

// useStore.subscribe(() => {
//   console.log('new state', useStore.getState());
// })

export {useStore, useConStore};