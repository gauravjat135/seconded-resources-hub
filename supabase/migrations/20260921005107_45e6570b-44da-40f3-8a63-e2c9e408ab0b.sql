DROP POLICY "Participants can read conversation messages" ON public.messages;
DROP POLICY "Participants can send conversation messages" ON public.messages;
DROP FUNCTION IF EXISTS public.is_conversation_participant(uuid);

CREATE POLICY "Participants can read conversation messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (lower(c.buyer_email) = public.current_email() OR lower(c.seller_email) = public.current_email())
  ));
CREATE POLICY "Participants can send conversation messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    lower(sender_email) = public.current_email()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (lower(c.buyer_email) = public.current_email() OR lower(c.seller_email) = public.current_email())
    )
  );