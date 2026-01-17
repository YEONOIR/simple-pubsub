// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  // unsubscribe ( /* Question 2 - build this feature */ );
  unsubscribe (type: string, handler: ISubscriber) : void;
}


// implementations
class MachineSaleEvent implements IEvent {
  private readonly _sold: number;
  private readonly _machineId: string;

  constructor(sold: number, machineId: string) {
    this._sold = sold;
    this._machineId = machineId;
  }

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold
  }

  type(): string {
    return 'sale';
  }
}

// add missing return
class MachineRefillEvent implements IEvent {
  private readonly _refill: number;
  private readonly _machineId: string

  constructor(refill: number, machineId: string) {
    this._refill = refill;
    this._machineId = machineId;
  }

  machineId(): string {
    return this._machineId;
  }

  getRefillQuantity(): number{
    return this._refill;
  }

  type(): string {
    return 'refill';
  }
}

class LowStockWarningEvent implements IEvent{
  private readonly _machineId: string;

  constructor(machineId: string) {
    this._machineId = machineId;
  }

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return 'lowstock';
  }
}

class StockLevelOkEvent implements IEvent{
  private readonly _machineId: string;

  constructor(machineId: string) {
    this._machineId = machineId;
  }

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return 'stockok';
  }
}

//subscriber
class MachineSaleSubscriber implements ISubscriber {
  private _repo: MachineRepository;
  private _pubsub: IPublishSubscribeService
  constructor(repo: MachineRepository, pubsub: IPublishSubscribeService){
    this._repo = repo;
    this._pubsub = pubsub;
  }

  handle(event: MachineSaleEvent): void {
    // send result to compile in updateStock -> prevent direct access to array, -event
    const result = this._repo.updateStock(event.machineId(), -event.getSoldQuantity());
    
    if(result){
      console.log(`[Sale] Machine ${event.machineId()} sold ${event.getSoldQuantity()}.\n Stock: ${result.oldLevel} -> ${result.newLevel}`);
      
      if(result.oldLevel >= 3 && result.newLevel < 3){
        this._pubsub.publish(new LowStockWarningEvent(event.machineId()));
      }
    }
  }
}

class MachineRefillSubscriber implements ISubscriber {
  private _repo: MachineRepository;
  private _pubsub: IPublishSubscribeService;

  constructor(repo: MachineRepository, pubsub: IPublishSubscribeService){
    this._repo = repo;
    this._pubsub = pubsub;
  }

  handle(event: MachineRefillEvent): void {
    // send result to compile in updateStock -> prevent direct access to array
    const result = this._repo.updateStock(event.machineId(), event.getRefillQuantity());
    
    if(result){
      console.log(`[Refill] Machine ${event.machineId()} refilled ${event.getRefillQuantity()}.\n Stock: ${result.oldLevel} -> ${result.newLevel}`);
      
      if(result.oldLevel < 3 && result.newLevel >= 3){
        this._pubsub.publish(new StockLevelOkEvent(event.machineId()));
      }
    }
  }
}

class LowStockWarningSubscriber implements ISubscriber{
   handle(event: LowStockWarningEvent): void {
    console.log(`Warning: Machine ${event.machineId()} is low on stock!`);
  }

}

class StockLevelOkSubscriber implements ISubscriber{
  handle(event: StockLevelOkEvent): void {
    console.log(`Status OK: Machine ${event.machineId()}'s stock is back to normal`);
  }
}

//pubsub class needed to be fix
class PublishSubscribeService implements IPublishSubscribeService{
  private subscribers: Map<string, ISubscriber[]> = new Map(); // store subscriber
  private eventeQueues: IEvent[] = []; // store event that is occur
  private isProcessing: boolean = false; // event status  

  subscribe(type: string, handler: ISubscriber): void {
    //check if the key of this type in Map is not exist
    if(!this.subscribers.has(type)){
      this.subscribers.set(type,[]);
    }

    // push new subscriber into Map (! -> to ensure that key is not null)
    this.subscribers.get(type)!.push(handler);
  }

  unsubscribe(type: string, handler: ISubscriber): void {
    const handlersList = this.subscribers.get(type);

    // filter the specific handler out and reassign to subcribers
    if (handlersList){
      this.subscribers.set(type, handlersList.filter(h => h != handler));
    }
  }

  //event spawner
  publish(event: IEvent): void {
    this.eventeQueues.push(event);

    // if the event is processing -> exist (reduce mis recursion in wrong order problem)
    if(this.isProcessing){
      return;
    }

    this.processQueue();
  }

  private processQueue(){
    this.isProcessing = true;

    while (this.eventeQueues.length > 0){
      const currentEvent = this.eventeQueues.shift();
      if(!currentEvent) continue;

      const handlersList = this.subscribers.get(currentEvent.type());
      if (handlersList){
        //[...handler] = cloning array -> if subscriber unsubed before event end it will still run without error
        [...handlersList].forEach(handler => handler.handle(currentEvent));
      }
    }

    this.isProcessing = false;
  }
}


// objects
class Machine {
  public stockLevel = 10;
  public id: string;

  constructor (id: string) {
    this.id = id;
  }
}

class MachineRepository{
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }
  
  findById(id: string): Machine | undefined{
    return this.machines.find((m => m.id === id))
  }

  updateStock(id: string, quantityChange: number): {newLevel: number, oldLevel: number} | null{
    const machine = this.findById(id);
    if (!machine) return null;

    const oldLevel = machine.stockLevel;
    machine.stockLevel += quantityChange;

    return {newLevel: machine.stockLevel, oldLevel};
  }
}


// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return '001';
  } else if (random < 2) {
    return '002';
  }
  return '003';

}

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  } 
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
}


// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [ new Machine('001'), new Machine('002'), new Machine('003') ];

  machines.push(new Machine('testlowevent'))

  // create Repo 
  const repo = new MachineRepository(machines);

  // create pubsub service
  const pubSubService = new PublishSubscribeService();
  
  // create subscriber
  const saleSubscriber = new MachineSaleSubscriber(repo, pubSubService);
  const refillSubscriber = new MachineRefillSubscriber(repo, pubSubService);
  const warningSubscriber = new LowStockWarningSubscriber();
  const okSubscriber = new StockLevelOkSubscriber();

  // regist subscriber
  pubSubService.subscribe('sale', saleSubscriber);
  pubSubService.subscribe('refill', refillSubscriber);
  pubSubService.subscribe('lowstock', warningSubscriber);
  pubSubService.subscribe('stockok', okSubscriber);

  console.log("--Start Simulation--");
  const events = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => eventGenerator());
  events.forEach(e => pubSubService.publish(e));

  // if the events above doesn't trigger the Low stock and Stock OK events 
  console.log("--Test Low stock and Stock OK event--");
  pubSubService.publish(new MachineSaleEvent(9, "testlowevent"));
  pubSubService.publish(new MachineRefillEvent(5, "testlowevent"));
})();
