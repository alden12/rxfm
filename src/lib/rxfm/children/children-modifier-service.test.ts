import { childrenModifierService, TestChildrenModifierService } from "./children-metadata";

const getChildElements = () => [
  document.createElement('span'),
  document.createElement('div'),
  document.createElement('button'),
  document.createElement('div'),
];

describe('ChilrenModifierService', () => {
  it('should exist when imported', () => {
    expect(childrenModifierService).toBeTruthy();
  })

  it('should correctly create children metadata when passed in for an element', () => {
    const metadataService = new TestChildrenModifierService();
    const element = document.createElement('div');
    const symbol = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol, []);

    expect(metadataService.inspectMetadata(element)?.blocks[0].symbol).toBe(symbol);
  });

  it('should put the block for a second children instance first', () => {
    const metadataService = new TestChildrenModifierService();
    const element = document.createElement('div');
    const symbol1 = Symbol('Test Chilren Operator');
    const symbol2 = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol1, []);
    metadataService.setChildren(element, symbol2, []);

    expect(metadataService.inspectMetadata(element)?.blocks[0].symbol).toBe(symbol2);
    expect(metadataService.inspectMetadata(element)?.blocks[1].symbol).toBe(symbol1);
  });

  it('should keep the second instance first even when first changes', () => {
    const metadataService = new TestChildrenModifierService();
    const element = document.createElement('div');
    const symbol1 = Symbol('Test Chilren Operator');
    const symbol2 = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol1, []);
    metadataService.setChildren(element, symbol2, []);
    const childElement = document.createElement('div');
    metadataService.setChildren(element, symbol1, childElement);

    expect(metadataService.inspectMetadata(element)?.blocks[0].symbol).toBe(symbol2);
    expect(metadataService.inspectMetadata(element)?.blocks[1].symbol).toBe(symbol1);
  });

  it('should correctly keep track of block lengths', () => {
    const metadataService = new TestChildrenModifierService();
    const element = document.createElement('div');
    const symbol1 = Symbol('Test Chilren Operator');
    const symbol2 = Symbol('Test Chilren Operator');
    const symbol3 = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol1, []);
    metadataService.setChildren(element, symbol2, []);
    metadataService.setChildren(element, symbol3, [document.createElement('div')]);

    expect(metadataService.inspectMetadata(element)?.blocks[0].length).toBe(1);
    expect(metadataService.inspectMetadata(element)?.blocks[1].length).toBe(0);
    expect(metadataService.inspectMetadata(element)?.blocks[2].length).toBe(0);
    const childElement = document.createElement('div');
    metadataService.setChildren(element, symbol2, childElement);
    expect(metadataService.inspectMetadata(element)?.blocks[0].length).toBe(1);
    expect(metadataService.inspectMetadata(element)?.blocks[1].length).toBe(1);
    expect(metadataService.inspectMetadata(element)?.blocks[2].length).toBe(0);
    metadataService.setChildren(element, symbol1, getChildElements());
    expect(metadataService.inspectMetadata(element)?.blocks[0].length).toBe(1);
    expect(metadataService.inspectMetadata(element)?.blocks[1].length).toBe(1);
    expect(metadataService.inspectMetadata(element)?.blocks[2].length).toBe(4);
  });

  // it('should maintain ordering even when many children are present', () => {
  //   const metadataService = new TestChildrenModifierService();
  //   const element = document.createElement('div');
  //   const symbol1 = Symbol('Test Chilren Operator');
  //   const symbol2 = Symbol('Test Chilren Operator');
  //   metadataService.setChildren(element, symbol1, []);
  //   metadataService.setChildren(element, symbol2, []);

  //   expect(metadataService.inspectMetadata(element)?.blocks[0].symbol).toBe(symbol2);
  //   expect(metadataService.inspectMetadata(element)?.blocks[1].symbol).toBe(symbol1);
  // });
});
