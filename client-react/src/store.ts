import create from "zustand";

type store = {
  activeUsers: any;
  userSpecificId: string;
  userConnectionGradients: any;
  // setConnectionGradients: any;
};

const useStore = create<store>((set) => ({
  activeUsers: {},
  userSpecificId: "",
  userConnectionGradients: {},
  // setConnectionGradients: (id:any, connectionGradients: any) => {
  //   set(state => {...state} {connectionGradients[id]: connectionGradients})
  // }
}));

// useStore.subscribe(() => {
//   console.log('new state', useStore.getState());
// })

export default useStore;
