import * as React from 'react';
import {mount} from 'enzyme';

import {TourProvider, Tour, Step} from '../src/lib';

jest.useFakeTimers();

const createDelay = (ms) => (fn) => {
  return new Promise(res => {
    setTimeout(() => {fn(), res()}, ms)
  })
}


const withStep = (id: string) =>
  ({onNext, onPrev, onClose}) => (
    <div id={id}>
      <button className="next" onClick={onNext}>next</button>
      <button className="prev" onClick={onPrev}>prev</button>
      <button className="close" onClick={onClose}>close</button>
    </div>
  )

const Step1 = withStep('id1');
const Step2 = withStep('id2');
const Step3 = withStep('id3');

describe('Tour. basic scenario', () => {
  let wrapper;
  beforeAll(() => {
    wrapper = mount(
      <TourProvider predicate={(id) => true} onTourShown={(id) => {}}>
        <Tour id="someid">
          <Step render={Step1}/>
          <Step render={Step2}/>
          <Step render={Step3}/>
        </Tour>
      </TourProvider>
    )
  })
  it('only first step will be rendered on start', () => {
    expect(wrapper.find('#id1').length).toBe(1)
    expect(wrapper.find('#id2').length).toBe(0)
    expect(wrapper.find('#id3').length).toBe(0)
  })
  it('after next click only second tour is showing', () => {
    wrapper.find('.next').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(1)
    expect(wrapper.find('#id3').length).toBe(0)
  })
  it('after prev click only first is rendering', () => {
    wrapper.find('.prev').simulate('click')
    expect(wrapper.find('#id1').length).toBe(1)
    expect(wrapper.find('#id2').length).toBe(0)
    expect(wrapper.find('#id3').length).toBe(0)
  })
  it('after close nothing is showing', () => {
    wrapper.find('.close').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(0)
    expect(wrapper.find('#id3').length).toBe(0)
  })
})

describe('Tour. onBefore, onAfter', () => {
  let wrapper;
  const beforeStep1 = jest.fn();
  const beforeStep2 = jest.fn();
  const afterStep1 = jest.fn();
  const afterStep2 = jest.fn();
  const onShown = jest.fn()
  const delay = createDelay(1000);
  const onBefore1 = () => delay(beforeStep1);
  const onBefore2 = () => delay(beforeStep2);
  const onAfter1 = () => delay(afterStep1);
  const onAfter2 = () => delay(afterStep2);
  const cbs = [beforeStep1, afterStep1, beforeStep2, afterStep2]
  const getCalls = (cbs) => cbs.map(cb => cb.mock.calls.length).join(' ');
  beforeAll(() => {
    wrapper = mount(
      <TourProvider predicate={(id) => true} onTourShown={(id) => onShown(id)}>
        <Tour id="someid">
          <Step onBefore={onBefore1} onAfter={onAfter1} render={Step1}/>
          <Step onBefore={onBefore2} onAfter={onAfter2} render={Step2}/>
        </Tour>
      </TourProvider>
    )
  });

  it('only onBefore will be called on start', () => {
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('1 0 0 0');
  })
  it('after next click onAfter should be called', () => {
    wrapper.update();
    wrapper.find('.next').simulate('click')
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('1 1 0 0');
  })
  it('onBefore should be called right after onAfter', () => {
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('1 1 1 0');
  })
  it('after prev click onAfter should be called', () => {
    wrapper.update();
    wrapper.find('.prev').simulate('click')
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('1 1 1 1');
  })
  it('onBefore should be called right after onAfter', () => {
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('2 1 1 1');
  })
  it('after close just onAfter will be called', () => {
    wrapper.update();
    wrapper.find('.close').simulate('click')
    jest.runOnlyPendingTimers();
    expect(onShown).not.toHaveBeenCalled();
    expect(getCalls(cbs)).toBe('2 2 1 1');
  })
  it('onShown should be called right after onAfter', () => {
    jest.runOnlyPendingTimers();
    expect(getCalls(cbs)).toBe('2 2 1 1');
    expect(onShown).toHaveBeenCalledWith('someid')
  })
})

describe('Tour. final step in the middle', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <TourProvider predicate={(id) => true} onTourShown={(id) => {}}>
        <Tour id="someid">
          <Step render={Step1}/>
          <Step isFallback render={Step2}/>
          <Step render={Step3}/>
        </Tour>
      </TourProvider>
    )
  })
  it('after next click final tour is skiping', () => {
    wrapper.find('.next').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(0)
    expect(wrapper.find('#id3').length).toBe(1)
  })
  it('after next click on last step tour is closing', () => {
    wrapper.find('.next').simulate('click')
    wrapper.find('.next').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(0)
    expect(wrapper.find('#id3').length).toBe(0)
  })
  it('after close only final step is showing', () => {
    wrapper.find('.close').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(1)
    expect(wrapper.find('#id3').length).toBe(0)
  })
})

describe('Tour. final step in the end', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <TourProvider predicate={(id) => true} onTourShown={(id) => {}}>
        <Tour id="someid">
          <Step render={Step1}/>
          <Step isFallback render={Step2}/>
        </Tour>
      </TourProvider>
    )
  })
  it('after close only final step is showing', () => {
    wrapper.find('.close').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(1)
  })
  it('after close on final step nothing is showing', () => {
    wrapper.find('.close').simulate('click')
    wrapper.find('.close').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(0)
  })
  it('after next click tour is closing', () => {
    wrapper.find('.next').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    expect(wrapper.find('#id2').length).toBe(0)
  })
})

describe('Tour. Api', () => {
  let wrapper;
  const subscribe = jest.fn((id, cb) => cb());
  const unsubscribe = jest.fn();
  const onShown = jest.fn();
  beforeEach(() => {
    wrapper = mount(
      <Tour id="someid">
        <Step render={Step1}/>
        <Step render={Step2}/>
        <Step render={Step3}/>
      </Tour>
    , {
      context: {
        [TourProvider.contextName]: {
          subscribe,
          unsubscribe,
          onShown,
        },
      }
    })
  })
  it('subscribe will be called after render', () => {
    expect(subscribe.mock.calls.length).toBe(1);
    expect(onShown.mock.calls.length).toBe(0);
  })
  it('onShown and unsubscribe called after close', () => {
    wrapper.find('.close').simulate('click')
    expect(unsubscribe.mock.calls.length).toBe(1);
    expect(onShown.mock.calls.length).toBe(1);
  })
  it('onShown should not called without manual closing', () => {
    wrapper.unmount();
    expect(unsubscribe.mock.calls.length).toBe(2);
    expect(onShown.mock.calls.length).toBe(1);
  })
})

export class TourContainer extends React.Component {
  tour = null;

  render() {
    return (
      <div>
        <TourProvider predicate={(id) => true} onTourShown={() => {}}>
          <Tour id="someid" ref={(tour) => this.tour = tour}>
            {this.props.children}
          </Tour>
        </TourProvider>
        <button className="run" onClick={this.run}>run</button>
      </div>
    )
  }

  run = () => {
    this.tour.run();
  }
}

describe('Tour. restart', () => {
  let wrapper;
  beforeAll(() => {
    wrapper = mount(
      <TourContainer>
        <Step render={Step1}/>
        <Step render={Step2}/>
      </TourContainer>
    )
  })
  it('tour should start again', () => {
    expect(wrapper.find('#id1').length).toBe(1)
    wrapper.find('.close').simulate('click')
    expect(wrapper.find('#id1').length).toBe(0)
    wrapper.find('.run').simulate('click')
    expect(wrapper.find('#id1').length).toBe(1)
  })
})
