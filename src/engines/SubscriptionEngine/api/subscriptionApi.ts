import {SubscriptionEngine} from '../SubscriptionEngine'
import PaymentProviderEvent from '../models/PaymentProviderEvent'
import PaymentProvider, {PaymentProviders} from '../models/PaymentProvider'
import Subscription from '../models/Subscription'
import SubscriptionUpdate from '../models/SubscriptionUpdate'

export default function (c: SubscriptionEngine) {
  return function (router, opts, next) {
    router.post('/hooks/:providerKey', async function (request, reply) {
      const data = request.body;
      const providerKey = request.params.providerKey;

      const paymentProvider = await c.m.findOneBy(PaymentProvider, {providerKey});

      const paymentProviderEvent = await c.em.createAndSave(PaymentProviderEvent, {
        data,
        paymentProvider: paymentProvider ? {id: paymentProvider.id} : null,
      });
      if (!paymentProvider) {
        reply.send({ok: false, error: 'No payment provider'});
      }

      let eventData: {
        eventType: string,
        subscriptionExtId: string,
        updateExtId: string,
      };

      // normalize provider data
      if (paymentProvider.provider === PaymentProviders.paddle) {

        /*
        https://developer.paddle.com/webhook-reference/3c0355dc446b0-subscription-cancelled

        eventTypes:
         - subscription_created
         - subscription_updated
         - subscription_cancelled
         */

        eventData = {
          eventType: data['alert_name'],
          subscriptionExtId: data['subscription_id'],
          updateExtId: data['alert_id'],
        }
      }

      if (eventData?.subscriptionExtId) {

        if (eventData.eventType === 'subscription_created') {
          const {value: subscription} = await c.em.findOneOrCreateBy(Subscription, {
            subscriptionExtId: eventData.subscriptionExtId,
            paymentProvider: {id: paymentProvider.id},
          }, {
            enabled: true,
          });

          const subscriptionUpdate = await c.em.createAndSave(SubscriptionUpdate, {
            subscription: {id: subscription.id},
            paymentProvider: {id: paymentProvider.id},
            paymentProviderEvent: {id: paymentProviderEvent.id},
            subscriptionExtId: eventData.subscriptionExtId,
            updateExtId: eventData.updateExtId,
            club: subscription.clubId ? {id: subscription.clubId} : null,
          });

          c.events.emit('subscriptionCreated', {
            subscription,
            subscriptionUpdate
          });
        }

      }

      reply.send({ok: true});
    });

    router.get('/:key', async function (request, reply) {
      reply.send({ok: true});
    });

    next();
  }

}
